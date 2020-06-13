/*
 * File: Server.js
 * Project: hap-homematic
 * File Created: Saturday, 7th March 2020 12:47:00 pm
 * Author: Thomas Kluge (th.kluge@me.com)
 * -----
 * The MIT License (MIT)
 *
 * Copyright (c) Thomas Kluge <th.kluge@me.com> (https://github.com/thkl)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ==========================================================================
 */

const uuid = require('hap-nodejs').uuid
const Bridge = require('hap-nodejs').Bridge
const BridgeMock = require('./BridgeMock.js')

const HAP = require('hap-nodejs')
const Accessory = require('hap-nodejs').Accessory
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')

const HomeMaticCCU = require(path.join(__dirname, 'HomeMaticCCU.js'))
const HomeMaticTestCCU = require(path.join(__dirname, 'HomeMaticTestCCU.js'))

const ApplianceType = {
  Device: 0,
  Variable: 1,
  Program: 2,
  Special: 3
}

class Server {
  constructor (log, configurationPath) {
    this.log = log
    if (configurationPath) {
      this._configurationPath = configurationPath
      this._hapCache = path.join(configurationPath, 'persist')
      this._publishedAccessories = {}
      this._variableAccessories = [] // used to äÄöÖüÜ fetch all at the key event
      this._specialAccessories = []
      this._configuration = {}
      this.isTestMode = false
      this.loadSettings()
      this.gatoHomeBridge = {
        hap:
        {
          Characteristic: Characteristic,
          Service: Service
        },
        user: {
          storagePath: () => { return this._configurationPath }
        }
      }
    } else {
      this.gatoHomeBridge = {
        hap:
        {
          Characteristic: Characteristic,
          Service: Service
        },
        user: {
          storagePath: () => { return null }
        }
      }
    }
  }

  async init (dryRun) {
    let self = this
    this.dryRun = dryRun
    this.log.info('[Server] Using config from %s', this._hapCache)
    HAP.init(this._hapCache)
    this.launchUIConfigurationServer()
    await this.publishServiceTable()
    this._ccu = new HomeMaticCCU(this.log, this._configuration)

    // read the restart count and increment it
    var rcCounter = 0
    let rcFile = path.join(this._hapCache, 'restartCounter.json')
    if (fs.existsSync(rcFile)) {
      rcCounter = JSON.parse(fs.readFileSync(rcFile))
    }
    rcCounter = rcCounter + 1
    this.log.info('[Server] current restart count is  %s', rcCounter)
    if (rcCounter >= 5) {
      this.log.info('[Server] current restart count is  >= 5 disable monitoring')
      // disable monitoring cause somethin is seriously wrong
      this._ccu.configuration.enableMonitoring = false // remove the flag
      this._ccu._removemonitconfig()
    }
    fs.writeFileSync(rcFile, JSON.stringify(rcCounter))
    this._ccu.dryRun = this.dryRun
    this.checkRegaAlive()

    // setup a Timer for 1hour to remove the rcFile if there is one
    // this will also reset the timer
    setTimeout(() => {
      try {
        self.log.info('[Server] seems we are stable since 1 hour remove the restart counter')
        if (fs.existsSync(rcFile)) {
          fs.unlinkSync(rcFile)
          // also resetup the monitoring
          self._ccu.processMonitoring()
        }
      } catch (e) {
        self.log.error('[Server] unable to reset restart counter or enable monitoring')
      }
    }, 60 * 60 * 1000)
  }

  async checkRegaAlive () {
    // wait until the ccu is alive
    let self = this
    let ccuIsRegaAlive = await this._ccu.pingRega()
    if (ccuIsRegaAlive) {
      this.log.info('[Server] Rega is alive going ahead')
      this.continueInitialization()
    } else {
      // wait 2 secondz
      setTimeout(() => {
        self.log.warn('[Server] Rega is out of home .. try again in 2 seconds')
        self.checkRegaAlive()
      }, 2000)
    }
  }

  getConfig (key) {
    return this._configuration[key]
  }

  async continueInitialization () {
    let self = this
    await this.connectCCU()
    this.log.info('[Server] Bridge Connections are up for %s bridges', this._bridges.length)

    this._ccu.on('devicelistchanged', async () => {
      // rebuild the service list
      self.log.debug('[Server] CCU DeviceList just changed')
      await self._buildCompatibleObjectList()
    })
    await self.publishServiceTable()
  }

  async simulate (simPath, simData) {
    // Load the simfile
    let self = this
    if (simPath !== undefined) {
      this.log.info('Simulation starts')
      this._configurationPath = simPath
      let simfile = path.join(simPath, 'devices.json')
      if (fs.existsSync(simfile)) {
        let oDb = JSON.parse(fs.readFileSync(simfile))
        let serviceList = await this.buildServiceList()
        let supportedChannelList = Object.keys(serviceList)

        let devAdrList = []
        let devList = []
        if (oDb.devices) {
          oDb.devices.map(device => {
            device.channels.map(channel => {
            // first check DEVICETYPE:CHANNELTYPE
              if (supportedChannelList.indexOf(device.type + ':' + channel.type) > -1) {
                channel.isSuported = true
                if (devAdrList.indexOf(device.address) === -1) {
                  devAdrList.push(device.address)
                  devList.push(device)
                }
              }

              if (supportedChannelList.indexOf(channel.type) > -1) {
                channel.isSuported = true
                if (devAdrList.indexOf(device.address) === -1) {
                  devList.push(device)
                  devAdrList.push(device.address)
                }
              }
            })
          })
        }
        this.log.info('[Server] list of supported devices')
        devList.map(device => {
          self.log.info('Device : %s | %s', device.name, device.address)
          device.channels.map(channel => {
            if (channel.isSuported === true) {
              self.log.info('Channel : %s | %s', device.name, channel.address)
            }
          })
        })
      } else {
        this.log.error('File not found %s', simfile)
      }
      this.log.info('Simulation status end will power up the system in test mode')
      await this.loadSettings()
      this.launchUIConfigurationServer()
      await this.publishServiceTable()
      this._ccu = new HomeMaticCCU(this.log, this._configuration)
      await this._ccu.loadDatabases(simPath, true) // Start CCU in testMOde
      this.log.info('[Server] Bridge Connections skipped as we are in test mode')
      this._bridges = []
      this._publishedAccessories = {}
      await self._buildCompatibleObjectList()
      this.publishAccessoriesToConfigurationService()
      this.publishBridgeInfosToConfigurationService()
      return
    }
    if (simData) {
      // this is for unit tests
      if ((simData.config) && (simData.devices)) {
        this.isTestMode = true
        this._configuration = simData.config
        await this.publishServiceTable()
        this.log.debug('[Server] Powering Test CCU')
        this._ccu = new HomeMaticTestCCU(this.log, this._configuration)
        this._ccu.init()
        this._ccu.setDummyDevices(simData.devices)
        if (simData.values) {
          this._ccu.setDummyValues(simData.values)
        }
        this.log.debug('[Server] Bridge Connections skipped as we are in test mode')
        this._bridges = []
        this._publishedAccessories = {}
        await self._buildCompatibleObjectList()
        if (simData.mappings) {
          this.log.debug('[Server] TestMode Mapping : %s', JSON.stringify(simData.mappings))
        }
        this._configuration.mappings = simData.mappings || {}
        var serviceConfig = await this.buildServiceList()
        this.buildMappings(this._configuration.mappings, serviceConfig)
        this.log.debug('[Server] power up mockup bridge as we are in test mode')
        let channels = []
        // create a empty mapping if not set by the test
        this._configuration.channels.map(channelAddress => {
          let channel = {}

          // generate a dummy channel objectservice used for
          simData.devices.map(simDevice => {
            simDevice.channels.map(simChannel => {
              if (simChannel.address === channelAddress) {
                channel = simChannel
                channel.dtype = simDevice.type
              }
            })
          })

          channels.push(channel)
        })

        // create a test Instance b6589fc6-ab0d-4c82-8f12-099d1c2d40ab is default id
        this.powerUpBridges({'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab': {'name': 'test', 'user': '11:22:33:44:55:66', 'pincode': '123-456-789'}}, channels, [], [], [])
        this.log.debug('[Server] test mode setup done')
      }
    }
  }

  powerUpBridges (lInstances, channelsToMap, variables, programs, special) {
    let self = this
    var i = 0
    // Check Instances to power up
    Promise.all(
      Object.keys(lInstances).map(instanceID => {
        self.log.debug('[Server] loading instance %s with name %s', instanceID, JSON.stringify(lInstances[instanceID]))
        let instanceData = lInstances[instanceID] || {pin: self.generatePin(), name: 'default'}
        let bridge = self.loadInstance(instanceID, instanceData, channelsToMap, variables, programs, special, i)
        self._bridges.push(bridge)
        i = i + 1
      })
    )
  }

  saveSettings (settings) {
    let configFile = path.join(this._configurationPath, 'config.json')
    fs.writeFileSync(configFile, JSON.stringify(settings, ' ', 1))
  }

  /** creates the default homekit instance */
  createDefaultInstance () {
    let defInst = uuid.generate('0')
    let instances = {}
    instances[defInst] = {name: 'default', user: this.randomMac(), pin: this.generatePin()}
    this.saveSettings({instances: instances})
    this._configuration.instances = instances
    return this._configuration.instances
  }

  async connectCCU () {
    let self = this
    this._bridges = []
    await this._ccu.connect()
    await this._ccu.loadDatabases(this._configurationPath)

    let lInstances = this._configuration.instances
    if (lInstances === undefined) {
      lInstances = this.createDefaultInstance()
    }
    this.log.debug('[Server] instances to load : %s', JSON.stringify(lInstances))
    let channelsToMap = []
    self.log.debug('[Server] mapping requested channels')
    if (this._configuration.channels) {
      Promise.all(this._configuration.channels.map(chaddress => {
        let channel = self._ccu.getChannelByAddress(chaddress)
        if (channel) {
          channelsToMap.push(channel)
        }
      }))
    }

    let variablesToMap = []
    if (this._configuration.variables) {
      Promise.all(this._configuration.variables.map(variable => {
        // create a fake channel address so the splitter will work
        variablesToMap.push({name: variable, address: variable + ':0'})
      }))
    }
    self.log.debug('[Server] mapping requested variables %s found', variablesToMap.length)

    let programsToMap = []
    if (this._configuration.programs) {
      Promise.all(this._configuration.programs.map(program => {
        // create a fake channel address so the splitter will work
        programsToMap.push({name: program, address: program + ':0'})
      }))
    }

    let specialToMap = []
    if (this._configuration.special) {
      Promise.all(this._configuration.special.map(special => {
        // create a fake channel address so the splitter will work
        specialToMap.push({name: special, address: special + ':0'})
      }))
    }

    self.log.debug('[Server] mapping requested programs %s found', programsToMap.length)

    if ((channelsToMap.length > 0) || (variablesToMap.length > 0) || (programsToMap.length > 0) || (specialToMap.length > 0)) {
      this.powerUpBridges(lInstances, channelsToMap, variablesToMap, programsToMap, specialToMap)
      this.log.debug('[Server] preparing interface communication to ccu')
      this._ccu.prepareInterfaces()
      this.log.info('[Server] publishing accessories')
      this.publishAccessoriesToConfigurationService()
      this.publishBridgeInfosToConfigurationService()
      this.publishVirtualKeys()
      // Setup the Variable Update Event
      if (this._configuration.VariableUpdateEvent) {
        this._ccu.registerAddressForEventProcessingAtAccessory(this._configuration.VariableUpdateEvent, () => {
          self._variableAccessories.map(variableAccessory => {
            variableAccessory.updateVariable()
          })
        })
      }
    } else {
      this.log.warn('[Server] no channels to map in configuration found')
      // Power up the instances in dry mode
      this.powerUpBridges(lInstances, [], [], [], [])
      // ok we will need this for wizzard start
      this.publishAccessoriesToConfigurationService()
      this.publishBridgeInfosToConfigurationService()
      this.publishVirtualKeys()
    }
    this._buildCompatibleObjectList()
    this.reloadMode = false
    // we are done with the initialization so update the databases
    this._ccu.updateDatabases(this._configurationPath)
  }

  randomMac () {
    var mac = '12:34:56'

    for (var i = 0; i < 6; i++) {
      if (i % 2 === 0) mac += ':'
      mac += Math.floor(Math.random() * 16).toString(16)
    }

    return mac
  }

  generatePin () {
    let code = Math.floor(10000000 + Math.random() * 90000000) + ''
    code = code.split('')
    code.splice(3, 0, '-')
    code.splice(6, 0, '-')
    code = code.join('')
    return code
  }

  loadInstance (instId, instanceData, ccuDevices, variables, programs, special, portInc) {
    let self = this
    let pin = instanceData.pincode || this.generatePin()
    let clearedName = instanceData.name.replace(/[.:#_()-]/g, ' ') // Issue #73
    let instanceName = 'HomeMatic_' + clearedName || 'HomeMatic_' + self.pad(instId, 2)
    let hkfname = 'HomeMatic ' + clearedName || 'HomeMatic ' + self.pad(instId, 2)
    let username = instanceData.user || self.randomMac()
    var bridge
    if (this.isTestMode) {
      self.log.debug('[Server] powering up test bridge : %s with userid %s and pinCode ', hkfname, username, pin)
      bridge = new BridgeMock(hkfname, instId)
    } else {
      self.log.info('[Server] powering up bridge : %s with id %s , userid %s and pinCode ', hkfname, instId, username, pin)
      bridge = new Bridge(hkfname, instId)
    }

    // load Channels and Build accessories
    self.log.debug('[Server] loading devices for instance %s', instId)
    var hazObjects = true
    if (ccuDevices) {
      if (!self._loadAccessories(ccuDevices, instId, bridge, instanceData.publishDevices)) {
        hazObjects = false
      }
    }
    // load variables and Build accessories
    self.log.debug('[Server] loading variables for instance %s', instId)

    if (!self._loadVariables(variables, instId, bridge, instanceData.publishDevices)) {
      hazObjects = false
    }
    self.log.debug('[Server] loading programs for instance %s', instId)

    if (!self._loadPrograms(programs, instId, bridge, instanceData.publishDevices)) {
      hazObjects = false
    }

    self.log.debug('[Server] loading special devices for instance %s', instId)

    if (!self._loadSpecialDevices(special, instId, bridge, instanceData.publishDevices)) {
      hazObjects = false
    }

    if (!hazObjects) {
      this.log.debug('[Server] no devices in %s', instanceName)
    }

    let info = bridge.getService(Service.AccessoryInformation)
    bridge.instanceId = instId
    bridge.instanceName = hkfname
    bridge.roomId = instanceData.roomId || 0
    info.setCharacteristic(Characteristic.Manufacturer, 'github.com/thkl')
    info.setCharacteristic(Characteristic.Model, `HAPHomematic`)
    info.setCharacteristic(Characteristic.SerialNumber, hkfname)
    info.setCharacteristic(Characteristic.FirmwareRevision, self.getVersion())

    var publishInfo = {
      username: username,
      port: 9877 + portInc,
      pincode: pin,
      category: Accessory.Categories.BRIDGE,
      mdns: {multicast: true}
    }

    bridge.port = (9877 + portInc)
    // Do not publish the bridge in test mode
    if (!this.isTestMode) {
      bridge.publish(publishInfo, false)
    }

    bridge.on('listening', port => {
      self.log.info('[Server] hap-homematic instance %s (%s) is running on port %s.', instanceName, username, port)
    })

    bridge.on('identify', (paired, callback) => {
      self.log.info('[Server] identify %s %s', bridge.instanceId, paired ? '-paired-' : '-not paired-')
      callback()
    })
    if (self.isTestMode) {
      self.log.debug('[Server] Your Bridge ID %s PinCode is %s', instanceName, publishInfo.pincode)
    } else {
      self.log.info('[Server] Your Bridge ID %s PinCode is %s', instanceName, publishInfo.pincode)
    }
    return bridge
  }

  getVersion () {
    let packageFile = path.join(__dirname, '..', 'package.json')
    this.log.debug('[Server] Check Version from %s', packageFile)
    if (fs.existsSync(packageFile)) {
      try {
        let packageData = JSON.parse(fs.readFileSync(packageFile))
        this.log.debug('[Server] version is %s', packageData.version)
        return packageData.version
      } catch (e) {
        return 'no version found'
      }
    } else {
      return 'no version found'
    }
  }

  async loadSettings () {
    let configFileName = path.join(this._configurationPath, 'config.json')
    if (fs.existsSync(configFileName)) {
      try {
        let config = JSON.parse(fs.readFileSync(configFileName).toString())

        // todo Validate the stuff
        if ((config) && (config.special)) {
          var validatedConfig = config
          this.log.info('[Server] validating special config')
          // make sure we have special devices only once
          var validatedSpecial = []
          config.special.map(specialDevice => {
            if (validatedSpecial.indexOf(specialDevice) === -1) {
              validatedSpecial.push(specialDevice)
            }
          })
          validatedConfig.special = validatedSpecial

          this._configuration = validatedConfig
        } else {
          this._configuration = config
        }
      } catch (e) {
        console.log(e)
        this.log.error('[Server] JSON Error in configuration file')
        this._configuration = {}
        return
      }
    }

    // load dynamic classes
    var serviceConfig = await this.buildServiceList()
    this.buildMappings(this._configuration.mappings, serviceConfig)
  }

  buildMappings (mappings, serviceConfig) {
    // merge service mappings from user settings with internal config
    if (mappings === undefined) {
      mappings = {}
    }
    Object.keys(serviceConfig).map(key => {
      // create a new List for this type if not yet into the list
      if (mappings[key] === undefined) {
        mappings[key] = []
      }
      // add all services for this type
      serviceConfig[key].map(serviceName => {
        if (mappings[key].indexOf(serviceName) === -1) {
          mappings[key].push(serviceName)
        }
      })
    })
    return mappings
  }

  async publishServiceTable () {
    var serviceConfig = await this.buildServiceList()
    this.log.debug('[Server] current Service table %s', JSON.stringify(serviceConfig))
    if (this.configUI) {
      try {
        this.configUI.send({
          topic: 'services',
          services: serviceConfig
        })
      } catch (e) {
        this.log.error(e)
      }
    } else {
      this.log.debug('[Server] skipping service publishing to config server cause there is no config server (yet)')
    }
  }

  buildServiceList () {
    let self = this
    var serviceConfig = {}
    // this will loop thru all HomeMatic*Accessory.js files and get the ChannelTypes
    let sPath = path.join(__dirname, 'services')
    return new Promise((resolve, reject) => {
      fs.readdir(sPath, async (err, items) => {
        if (err) {
          reject(err)
        }
        await Promise.all(
          items.map(async (item) => {
            if (item.match(/HomeMatic.*Accessory.js/)) {
              let test = require(path.join(__dirname, 'services', item))
              let serviceName = test.name
              let channelTypes = test.channelTypes()
              let priority = test.getPriority()
              let serviceDescription = test.serviceDescription()
              let filterDevice = test.filterDevice()
              let settings = await test.configurationItems(self._ccu)
              if ((channelTypes) && (channelTypes.length > 0)) {
                channelTypes.map(channelType => {
                  if (serviceConfig[channelType] === undefined) {
                    serviceConfig[channelType] = []
                  }
                  serviceConfig[channelType].push({
                    serviceClazz: serviceName,
                    settings: settings,
                    priority: priority,
                    description: serviceDescription,
                    filterDevice: filterDevice
                  })
                })
              } else {
                self.log.warn('[Server] WARNING There is no Channeltype declaration in %s::channelTypes', serviceName)
              }
            }
          })
        )
        // sort the list by prioriy
        Object.keys(serviceConfig).map(key => {
          var list = serviceConfig[key]
          serviceConfig[key] = list.sort((a, b) => (a.priority > b.priority) ? 1 : -1)
        })

        resolve(serviceConfig)
      })
    })
  }

  pad (num, size) {
    var s = num + ''
    while (s.length < size) s = '0' + s
    return s
  }

  saveAccessories () {
    let self = this
    Object.keys(self._publishedAccessories).forEach((advertiseAddress) => {
      let accessory = self._publishedAccessories[advertiseAddress]
      let fn = path.join(self._configurationPath, advertiseAddress + '.json')
      fs.writeFileSync(fn, JSON.stringify(accessory._dictionaryPresentation()))
    })
  }

  addAccessory (accessory, bridge, publishToBridge) {
    let acUID = accessory.getUUID()
    if (this._publishedAccessories[acUID] === undefined) {
      this.log.debug('[Server] adding accessory %s', accessory.getName())
      if (publishToBridge === true) {
        bridge.addBridgedAccessory(accessory.getHomeKitAccessory())
        accessory.isPublished = true
        accessory.getHomeKitAccessory().updateReachability(true)
        bridge.hasPublishedDevices = true
      }
      this._publishedAccessories[acUID] = accessory
    } else {
      this.log.error('[Server] Unable to add a accessory with the same uuid %s as one added before', acUID)
    }
  }

  publishAccessoriesToConfigurationService () {
    var deviceData = []
    var variableData = []
    var programData = []
    var specialDev = []
    let self = this
    Object.keys(self._publishedAccessories).forEach((advertiseAddress) => {
      let accessory = self._publishedAccessories[advertiseAddress]
      // Sort the Appliances into diff arrays for WebUI
      switch (accessory.applianceType) {
        case ApplianceType.Variable:
          variableData.push(accessory._dictionaryPresentation())
          break
        case ApplianceType.Program:
          programData.push(accessory._dictionaryPresentation())
          break
        case ApplianceType.Special:
          specialDev.push(accessory._dictionaryPresentation())
          break
        case ApplianceType.Device:
          deviceData.push(accessory._dictionaryPresentation())
          break
      }
    })
    if (this.configUI) {
      let message = {
        topic: 'serverdata',
        accessories: deviceData,
        variables: variableData,
        programs: programData,
        special: specialDev,
        variableTrigger: this._configuration.VariableUpdateEvent,
        autoUpdateVarTriggerHelper: this._configuration.autoUpdateVarTriggerHelper,
        rooms: this._ccu.getRooms(),
        logfile: this.log.getLogFile()
      }
      try {
        this.configUI.send(message)
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  publishBridgeInfosToConfigurationService () {
    var data = []
    this.log.debug('[Server] publish bridge info')
    this._bridges.map(bridge => {
      let bAcInfo = bridge._accessoryInfo
      data.push({'id': bridge.instanceId,
        'user': bAcInfo.username,
        'displayName': bAcInfo.displayName,
        'pincode': bAcInfo.pincode,
        'hasPublishedDevices': bridge.hasPublishedDevices,
        'setupID': bAcInfo.setupID,
        'roomId': bridge.roomId,
        'port': bridge.port,
        'setupURI': bridge.setupURI()
      })
    })
    if (this.configUI) {
      try {
        this.configUI.send({
          topic: 'bridges',
          bridges: data
        })
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  publishVirtualKeys () {
    let result = []
    let self = this
    this._ccu.getCCUDevices().map((device) => {
      if (((device.type === 'HmIP-RCV-50') || (device.type === 'HM-RCV-50')) && (device.channels) && (device.channels.length > 0)) {
        let usedInterface = self._ccu.getInterfaceWithID(device.channels[0].intf)
        device.ifName = (usedInterface) ? usedInterface.name : 'unknown'
        result.push(device)
      }
    })
    if (this.configUI) {
      try {
        this.configUI.send({
          topic: 'virtualKeys',
          virtualKeys: result
        })
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  shutdownBridgeInstances () {
    let self = this
    this._bridges.map(bridge => {
      self.log.info('[Server] shutting down Homekit bridge %s', bridge.instanceName)
      bridge.unpublish()
    })

    Object.keys(self._publishedAccessories).forEach((advertiseAddress) => {
      self._publishedAccessories[advertiseAddress].getHomeKitAccessory().unpublish()
      self._publishedAccessories[advertiseAddress].shutdown()
    })
    this._bridges = []
    this._publishedAccessories = {}
    this._variableAccessories = []
    this._specialAccessories = []
  }

  _removeDevice (uuid) {
    let self = this
    let accessory = self._publishedAccessories[uuid]
    if (accessory) {
      accessory.removeData()
    }
  }

  sendSystemConfiguration () {

  }

  shutdown () {
    this.log.info('[Server] shutting down all homekit instances')
    this.shutdownBridgeInstances()

    setTimeout(() => {
      process.exit()
    }, 2000)

    this._ccu.shutdown()
    this.log.info('[Server] bye')
  }

  launchUIConfigurationServer () {
    let self = this
    process.env.UIX_CONFIG_PATH = this._configurationPath
    process.env.UIX_DEBUG = this.log.isDebugEnabled()

    this.configUI = childProcess.fork(path.resolve(__dirname, 'configurationsrv'), null, {
      env: process.env
    })

    this.log.info('Spawning configuration service with PID', this.configUI.pid)

    this.configUI.on('message', (message) => {
      self._handleIncommingIPCMessage(message)
    })
  }

  async _reloadAppliances () {
    if (this.reloadMode === true) {
      this.log.warn('[Server] skip reload currently running')
      return
    }
    this.reloadMode = true
    this.log.info('[Server] reloading all appliances')
    let self = this
    this.shutdownBridgeInstances()
    await this._ccu.disconnectInterfaces()
    setTimeout(() => {
      self.loadSettings()
      self.connectCCU()
    }, 1000)
  }

  _handleIncommingIPCMessage (message) {
    if ((message) && (message.topic)) {
      switch (message.topic) {
        case 'reloadApplicances':
          this._reloadAppliances()
          break

        case 'createTrigger':
          this._ccu.updateCCUVarTrigger(this._configuration.variables, this._configuration.VariableUpdateEvent)
          break
        case 'refreshCache':
          this._ccu.updateDatabases(this._configurationPath)
          this._ccu.updateDeviceDatabase()
          break

          // tell the device to remove its history and persistent data
        case 'remove':
          this._removeDevice(message.uuid)
          // reload all stuff
          this._reloadAppliances()
          break
        case 'debug':
          this.log.setDebugEnabled(message.debug)
          if (this.configUI) {
            try {
              this.configUI.send({
                topic: 'debug',
                debug: this.log.isDebugEnabled()
              })
            } catch (e) {
              this.log.error(e)
            }
          }
          break
        default:
          break
      }
    }
  }

  _findServiceClass (channel) {
    // First try settings address
    this.log.debug('[Server] try find serviceclazz for %s', channel.address)
    let mappings = this._configuration.mappings
    var sClass
    if (mappings) {
      sClass = mappings[channel.address]
      // Channel:Address Mapping is an object
      if (sClass) {
        if ((typeof sClass === 'object') && (sClass.Service)) {
          this.log.debug('[Server] service %s found thru address %s', sClass.Service, channel.address)
          return sClass.Service
        }
      }
    }
    sClass = mappings[channel.dtype + ':' + channel.type]
    if (sClass) {
      this.log.debug('[Server] mapping found %s:%s', channel.dtype, channel.type)
      if (typeof sClass === 'object') {
        if (Array.isArray(sClass)) {
          if (sClass[0].serviceClazz !== undefined) {
            this.log.debug('[Server] service %s found thru devicetype:channeltype %s:%s', sClass[0].serviceClazz, channel.dtype, channel.type)
            return sClass[0].serviceClazz
          }
        } else {
          if (sClass.serviceClazz !== undefined) {
            this.log.debug('[Server] service %s found thru devicetype:channeltype %s:%s', sClass.serviceClazz, channel.dtype, channel.type)
            return sClass.serviceClazz
          }
        }
      }
    }

    var sClassList = mappings[channel.type]
    if (sClassList) {
      this.log.debug('[Server] service %s found thru channeltype using the first service found %s', sClassList[0].serviceClazz, channel.type)
      return sClassList[0].serviceClazz
    }
    this.log.debug('[Server] nothing found for %s %s:%s', channel.address, channel.dtype, channel.type)

    return undefined
  }

  async _buildCompatibleObjectList () {
    // loop thru all devices an channels and try to find services
    let self = this
    let serviceList = await this.buildServiceList()
    let supportedChannelList = Object.keys(serviceList)
    this._compatibleDevices = []
    var devAdrList = [] // this is only for indication that we add the device just once
    if (this._ccu.getCCUDevices()) {
      this._ccu.getCCUDevices().map(device => {
        device.channels.map(channel => {
          // first check DEVICETYPE:CHANNELTYPE
          if (supportedChannelList.indexOf(device.type + ':' + channel.type) > -1) {
            channel.isSuported = true
            if (devAdrList.indexOf(device.address) === -1) {
              devAdrList.push(device.address)
              self._compatibleDevices.push(device)
            }
          }
          if (supportedChannelList.indexOf(channel.type) > -1) {
            // get the device filter and make sure the given device is not in the list
            let item = serviceList[channel.type]
            item.map(sClass => {
              if (sClass.filterDevice.indexOf(device.type) === -1) {
                channel.isSuported = true
                if (devAdrList.indexOf(device.address) === -1) {
                  devAdrList.push(device.address)
                  self._compatibleDevices.push(device)
                }
              }
            })
          }
        })
      })
    }
    this._ccuVariables = this._ccu.getVariables()
    // Loop thru all variables an select the boolean ones
    this._ccuVariables.map(variable => {
      if (((variable.valuetype === 2) && (variable.subtype === 2)) ||
        ((variable.valuetype === 4) && (variable.subtype === 0)) ||
        ((variable.valuetype === 16) && (variable.subtype === 29))
      ) {
        variable.isCompatible = true
      } else {
        variable.isCompatible = false
      }
    })

    // send the list to the configuration service
    if (this.configUI) {
      try {
        this.configUI.send({
          topic: 'compatibleObjects',
          devices: this._compatibleDevices,
          variables: this._ccuVariables,
          programs: this._ccu.getPrograms()
        })
      } catch (e) {
        this.log.error(e)
      }
    }
    // oh boy !
    if (this.isTestMode) {
      this.log.debug('[Server] %s compatible devices found', devAdrList.length)
    } else {
      this.log.info('[Server] %s compatible devices found', devAdrList.length)
    }
  }

  _loadVariables (variables, forInstanceID, bridge, publish) {
    let self = this
    let hazObjects = false
    Promise.all(
      variables.map(variable => {
        // Varaibles use there own Clazz
        var instanceToAdd = uuid.generate('0') // default is Instance 0
        let settings = self._configuration.mappings[variable.address]
        if ((settings !== undefined) && (settings.instance !== undefined)) {
          instanceToAdd = settings.instance
        }

        let sClass = (settings) ? (settings.Service || 'HomeMaticVariableAccessory') : 'HomeMaticVariableAccessory'
        let clazZFile = path.join(__dirname, 'services', sClass + '.js')

        // make sure we only initialize the channels for this instance
        if (instanceToAdd === forInstanceID) {
          self.log.debug('[Server] try adding variable %s to bridge %s using service %s', variable.name, forInstanceID, sClass)
          let Appliance = require(clazZFile)
          if (settings === undefined) {
            settings = {}
          }
          let accessory = new Appliance(variable, 'Variable', self, settings)
          // save the variable
          accessory.variable = self._ccu.variableWithName(variable.name)
          accessory.init()
          accessory.instanceID = forInstanceID
          accessory.serviceClass = sClass
          accessory.settings = settings
          accessory.applianceType = ApplianceType.Variable
          accessory.nameInCCU = variable.name
          this.addAccessory(accessory, bridge, publish)
          this._variableAccessories.push(accessory)
          hazObjects = true
        }
      })
    )
    return hazObjects
  }

  _loadSpecialDevices (special, forInstanceID, bridge, publish) {
    let self = this
    let hazObjects = false
    Promise.all(
      special.map(spDevice => {
        // Varaibles use there own Clazz
        var instanceToAdd = uuid.generate('0') // default is Instance 0
        let settings = self._configuration.mappings[spDevice.address]
        if ((settings !== undefined) && (settings.instance !== undefined)) {
          instanceToAdd = settings.instance
        }
        let sClass = settings.Service
        let clazZFile = path.join(__dirname, 'services', sClass + '.js')
        if (instanceToAdd === forInstanceID) {
          self.log.debug('[Server] try adding %s to bridge %s', spDevice.name, forInstanceID)
          let Appliance = require(clazZFile)
          if (settings === undefined) {
            settings = {}
          }
          let accessory = new Appliance(spDevice, 'Special', self, settings)
          accessory.init()
          accessory.instanceID = forInstanceID
          accessory.serviceClass = sClass
          accessory.settings = settings
          accessory.applianceType = ApplianceType.Special
          this.addAccessory(accessory, bridge, publish)
          hazObjects = true
        }
      })
    )

    return hazObjects
  }

  _loadPrograms (programs, forInstanceID, bridge, publish) {
    let self = this
    let hazObjects = false
    let sClass = 'HomeMaticProgramAccessory'
    let clazZFile = path.join(__dirname, 'services', sClass + '.js')
    Promise.all(
      programs.map(program => {
        // Varaibles use there own Clazz
        var instanceToAdd = uuid.generate('0') // default is Instance 0
        let settings = self._configuration.mappings[program.address]
        if ((settings !== undefined) && (settings.instance !== undefined)) {
          instanceToAdd = settings.instance
        }
        if (instanceToAdd === forInstanceID) {
          self.log.debug('[Server] try adding %s to bridge %s', program.name, forInstanceID)
          let Appliance = require(clazZFile)
          if (settings === undefined) {
            settings = {}
          }
          let accessory = new Appliance(program, 'Program', self, settings)
          accessory.init()
          accessory.instanceID = forInstanceID
          accessory.serviceClass = sClass
          accessory.settings = settings
          accessory.applianceType = ApplianceType.Program
          accessory.nameInCCU = program.name
          this.addAccessory(accessory, bridge, publish)
          hazObjects = true
        }
      })
    )

    return hazObjects
  }

  _loadAccessories (channelList, forInstanceID, bridge, publish) {
    let self = this
    var hazObjects = false
    Promise.all(
      channelList.map(channel => {
        let settings = self._configuration.mappings[channel.address]
        var instanceToAdd = uuid.generate('0') // default is Instance 0
        // if there are settings ... use instances from settings
        if ((settings !== undefined) && (settings.instance !== undefined)) {
          instanceToAdd = settings.instance
        }
        // make sure we only initialize the channels for this instance
        if (instanceToAdd === forInstanceID) {
          let sClass = self._findServiceClass(channel)
          if (sClass) {
            self.log.debug('[Server] try adding %s to bridge %s', channel.name, forInstanceID)
            let oInterface = self._ccu.getInterfaceWithID(channel.intf)
            if (oInterface) {
              oInterface.inUse = true
              if (!self.isTestMode) {
                self.log.info('[Server] service used for %s is %s', channel.name, sClass)
              } else {
                self.log.debug('[Server] service used for %s is %s', channel.name, sClass)
              }
              // Init the service class and create a appliance object
              try {
                let clazZFile = path.join(__dirname, 'services', sClass + '.js')
                if (fs.existsSync(clazZFile)) {
                  let Appliance = require(clazZFile)
                  let channelTypes = Appliance.channelTypes()
                  let filterDevice = Appliance.filterDevice()
                  if (((channelTypes.indexOf(channel.type) > -1) || (channelTypes.indexOf(channel.dtype + ':' + channel.type) > -1)) &&
                    // additional check the device type should not been in the filterDevice list
                    (filterDevice.indexOf(channel.dtype) === -1)) {
                    let accessory = new Appliance(channel, oInterface.name, self, settings)
                    accessory.init()
                    accessory.instanceID = forInstanceID
                    accessory.serviceClass = sClass
                    accessory.settings = settings
                    accessory.applianceType = ApplianceType.Device
                    // add the accessory to the bridge
                    if (publish === true) {
                      self.log.info('[Server] add %s to bridge instance %s', channel.name, forInstanceID)
                    }
                    self.addAccessory(accessory, bridge, publish)
                    hazObjects = true
                  } else {
                    self.log.error('[Server] unable to initialize %s', channel.name)
                    self.log.error('[Server] requested ServiceClass %s did not provide a service for %s', sClass, channel.type)
                  }
                } else {
                  self.log.error('Unable to initialize %s file %s was not found.', channel.name, clazZFile)
                }
              } catch (e) {
                self.log.error('Unable to initialize %s Error is %s', channel.name, e.stack)
              }
            } else {
              self.log.warn('[Server] Interface %s not found in ccu manager', channel.intf)
            }
          } else {
            self.log.warn('[Server] there is no known service for %s:%s on channel %s', channel.dtype, channel.type, channel.address)
          }
        } else {
          // not my instance
        }
      })
    )
    return hazObjects
  }
}

module.exports = Server
