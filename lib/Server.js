const uuid = require('hap-nodejs').uuid
const Bridge = require('hap-nodejs').Bridge
const HAP = require('hap-nodejs')
const Accessory = require('hap-nodejs').Accessory
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')

const HomeMaticCCU = require(path.join(__dirname, 'HomeMaticCCU.js'))

class Server {
  constructor (log, configurationPath) {
    this.log = log
    this._configurationPath = configurationPath
    this._hapCache = path.join(configurationPath, 'persist')
    this._publishedAccessories = {}
    this._variableAccessories = [] // used to äÄöÖüÜ fetch all at the key event
    this._configuration = {}

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
  }

  async init () {
    this.log.info('[Server] Using config from %s', this._hapCache)
    HAP.init(this._hapCache)
    this.launchUIConfigurationServer()
    this._ccu = new HomeMaticCCU(this.log, this._configuration)
    await this.connectCCU()
    this.log.info('[Server] Bridge Connections are up for %s bridges', this._bridges.length)
  }

  powerUpBridges (lInstances, channelsToMap, variables, programs) {
    let self = this
    var i = 0
    // Check Instances to power up
    Promise.all(
      Object.keys(lInstances).map(instanceID => {
        self.log.debug('[Server] loading instance %s with name %s', instanceID, JSON.stringify(lInstances[instanceID]))
        let instanceData = lInstances[instanceID] || {pin: self.generatePin(), name: 'default'}
        let bridge = self.loadInstance(instanceID, instanceData, channelsToMap, variables, programs, i)
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
    await this._ccu.loadDeviceDatabase(path.join(this._configurationPath, 'devices.json'))
    await this._ccu.loadVariableDatabase(path.join(this._configurationPath, 'variables.json'))
    await this._ccu.loadProgramDatabase(path.join(this._configurationPath, 'programs.json'))
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
    self.log.debug('[Server] mapping requested programs %s found', programsToMap.length)

    if ((channelsToMap.length > 0) || (variablesToMap.length > 0) || (programsToMap.length > 0)) {
      this.powerUpBridges(lInstances, channelsToMap, variablesToMap, programsToMap)
      this.log.debug('[Server] preparing interface communication to ccu')
      this._ccu.prepareInterfaces()
      this.log.info('[Server] publishing accessories')
      this.publishAccessoriesToConfigurationService()
      this.publishBridgeInfosToConfigurationService()
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
      this.powerUpBridges(lInstances, [], [], [])
      this.publishBridgeInfosToConfigurationService()
    }
    this._buildCompatibleObjectList()
    this.reloadMode = false
    // we are done with the initialization so update the device database
    this._ccu.updateDeviceDatabase(path.join(this._configurationPath, 'devices.json'))
    // and the variables
    this._ccu.updateVariableDatabase(path.join(this._configurationPath, 'variables.json'))
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

  loadInstance (instId, instanceData, ccuDevices, variables, programs, portInc) {
    let self = this
    let pin = instanceData.pin || this.generatePin()
    let instanceName = 'HomeMatic_' + instanceData.name || 'HomeMatic_' + self.pad(instId, 2)
    let username = instanceData.user || self.randomMac()
    self.log.info('[Server] powering up bridge : %s with userid %s and pinCode ', instanceName, username, pin)
    let bridge = new Bridge(instanceName, uuid.generate(instanceName))
    // load Channels and Build accessories
    self.log.debug('[Server] loading devices for instance %s', instId)
    self._loadAccessories(ccuDevices, instId, bridge, instanceData.publishDevices)
    // load variables and Build accessories
    self.log.debug('[Server] loading variables for instance %s', instId)
    self._loadVariables(variables, instId, bridge, instanceData.publishDevices)
    self.log.debug('[Server] loading programs for instance %s', instId)
    self._loadPrograms(programs, instId, bridge, instanceData.publishDevices)

    let info = bridge.getService(Service.AccessoryInformation)
    bridge.instanceId = instId
    info.setCharacteristic(Characteristic.Manufacturer, 'HAPHomematic')
    info.setCharacteristic(Characteristic.Model, `HAPHomematic`)
    info.setCharacteristic(Characteristic.SerialNumber, instanceName)
    info.setCharacteristic(Characteristic.FirmwareRevision, '0.1')
    var publishInfo = {
      username: username,
      port: 9876 + portInc,
      pincode: pin,
      category: Accessory.Categories.BRIDGE,
      mdns: {multicast: true}
    }
    bridge.publish(publishInfo, false)

    bridge.on('listening', port => {
      self.log.info('[Server] hap-homematic instance %s is running on port %s.', username, port)
    })

    bridge.on('identify', (paired, callback) => {
      self.log.info('[Server] identify %s', paired ? '-paired-' : '-not paired-')
      callback()
    })

    self.log.info('[Server] Your Bridge ID %s PinCode is %s', instanceName, publishInfo.pincode)
    return bridge
  }

  async loadSettings () {
    let self = this
    let configFileName = path.join(this._configurationPath, 'config.json')
    if (fs.existsSync(configFileName)) {
      try {
        this._configuration = JSON.parse(fs.readFileSync(configFileName).toString())
      } catch (e) {
        this.log.error('[Server] JSON Error in configuration file')
        this._configuration = {}
        return
      }
    }

    // load dynamic classes
    var serviceConfig = await this.buildServiceList()

    if (!this._configuration.mappings) {
      this._configuration.mappings = {}
    }

    // merge service mappings from user settings with internal config
    Object.keys(serviceConfig).map(key => {
      // create a new List for this type if not yet into the list
      if (self._configuration.mappings[key] === undefined) {
        self._configuration.mappings[key] = []
      }
      // add all services for this type
      serviceConfig[key].map(serviceName => {
        if (self._configuration.mappings[key].indexOf(serviceName) === -1) {
          self._configuration.mappings[key].push(serviceName)
        }
      })
    })
    if (this.configUI) {
      this.configUI.send({
        topic: 'services',
        services: serviceConfig
      })
    }
  }

  buildServiceList () {
    let self = this
    var serviceConfig = {}
    // this will loop thru all HomeMatic*Accessory.js files and get the ChannelTypes
    let sPath = path.join(__dirname, 'services')
    return new Promise((resolve, reject) => {
      fs.readdir(sPath, (err, items) => {
        if (err) {
          reject(err)
        }
        items.map(item => {
          if (item.match(/HomeMatic.*Accessory.js/)) {
            let test = require(path.join(__dirname, 'services', item))
            let serviceName = test.name
            let channelTypes = test.channelTypes()
            let settings = test.configurationItems()
            if ((channelTypes) && (channelTypes.length > 0)) {
              channelTypes.map(channelType => {
                if (serviceConfig[channelType] === undefined) {
                  serviceConfig[channelType] = []
                }
                serviceConfig[channelType].push({serviceClazz: serviceName, settings: settings})
              })
            } else {
              self.log.warn('[Server] WARNING There is no Channeltype declaration in %s::channelTypes', serviceName)
            }
          }
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
    Object.keys(self._publishedAccessories).forEach(function (advertiseAddress) {
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
    let self = this
    Object.keys(self._publishedAccessories).forEach(function (advertiseAddress) {
      let accessory = self._publishedAccessories[advertiseAddress]
      // remove variable accessories
      if (accessory.serviceClass.indexOf('Variable') > -1) {
        variableData.push(accessory._dictionaryPresentation())
      } else
      if (accessory.serviceClass.indexOf('Program') > -1) {
        programData.push(accessory._dictionaryPresentation())
      } else {
        deviceData.push(accessory._dictionaryPresentation())
      }
    })
    if (this.configUI) {
      this.configUI.send({
        topic: 'accessories',
        accessories: deviceData
      })
    }
    if (this.configUI) {
      this.configUI.send({
        topic: 'variables',
        variables: variableData,
        trigger: this._configuration.VariableUpdateEvent
      })
    }
    if (this.configUI) {
      this.configUI.send({
        topic: 'programs',
        programs: programData
      })
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
        'setupID': bAcInfo.setupID
      })
    })
    if (this.configUI) {
      this.configUI.send({
        topic: 'bridges',
        bridges: data
      })
    }
  }

  shutdownBridgeInstances () {
    let self = this
    this._bridges.map(bridge => {
      self.log.info('[Server] shutting down Homekit bridge %s')
      bridge.unpublish()
    })

    Object.keys(self._publishedAccessories).forEach((advertiseAddress) => {
      self._publishedAccessories[advertiseAddress].getHomeKitAccessory().unpublish()
      self._publishedAccessories[advertiseAddress].shutdown()
    })
    this._bridges = []
    this._publishedAccessories = {}
    this._variableAccessories = []
  }

  _removeDevice (uuid) {
    let self = this
    let accessory = self._publishedAccessories[uuid]
    if (accessory) {
      accessory.removeData()
    }
  }

  shutdown () {
    this.log.info('[Server] shutting down all homekit instances')
    this.shutdownBridgeInstances()

    setTimeout(function () {
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
    setTimeout(function () {
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

        case 'system':
          this.sendSystemConfiguration()
          break
          // tell the device to remove its history and persistent data
        case 'remove':
          this._removeDevice(message.uuid)
          // reload all stuff
          this._reloadAppliances()
          break

        default:
          break
      }
    }
  }

  _findServiceClass (channel) {
    // First try settings address
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
      this.log.debug('[Server] service %s found thru devicetype:channeltype %s:%s', sClass, channel.dtype, channel.type)
      return sClass
    }

    var sClassList = mappings[channel.type]
    if (sClassList) {
      this.log.debug('[Server] service %s found thru channeltype using the first service found %s', sClassList[0], channel.type)
      return sClassList[0]
    }

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
          if (supportedChannelList.indexOf(channel.type) > -1) {
            channel.isSuported = true
            if (devAdrList.indexOf(device.address) === -1) {
              devAdrList.push(device.address)
              self._compatibleDevices.push(device)
            }
          }
        })
      })
    }
    this._compatibleVariables = []
    // Loop thru all variables an select the boolean ones
    this._ccu.getVariables().map(variable => {
      if (((variable.valuetype === 2) && (variable.subtype === 2)) ||
        ((variable.valuetype === 4) && (variable.subtype === 0))
      ) {
        self._compatibleVariables.push(variable)
      }
    })

    // send the list to the configuration service
    if (this.configUI) {
      this.configUI.send({
        topic: 'compatibleObjects',
        devices: this._compatibleDevices,
        variables: this._compatibleVariables,
        programs: this._ccu.getPrograms()
      })
    }
    this.log.info('[Server] %s compatible devices found', devAdrList.length)
  }

  _loadVariables (variables, forInstanceID, bridge, publish) {
    let self = this
    let sClass = 'HomeMaticVariableAccessory'
    let clazZFile = path.join(__dirname, 'services', sClass + '.js')
    return Promise.all(
      variables.map(variable => {
        // Varaibles use there own Clazz
        var instanceToAdd = uuid.generate('0') // default is Instance 0
        let settings = self._configuration.mappings[variable.address]
        if ((settings !== undefined) && (settings.instance !== undefined)) {
          instanceToAdd = settings.instance
        }
        // make sure we only initialize the channels for this instance
        if (instanceToAdd === forInstanceID) {
          self.log.debug('[Server] try adding %s to bridge %s', variable.name, forInstanceID)
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
          this.addAccessory(accessory, bridge, publish)
          this._variableAccessories.push(accessory)
        }
      })
    )
  }

  _loadPrograms (programs, forInstanceID, bridge, publish) {
    let self = this
    let sClass = 'HomeMaticProgramAccessory'
    let clazZFile = path.join(__dirname, 'services', sClass + '.js')
    return Promise.all(
      programs.map(program => {
        // Varaibles use there own Clazz
        var instanceToAdd = uuid.generate('0') // default is Instance 0
        let settings = self._configuration.mappings[program.address]
        if ((settings !== undefined) && (settings.instance !== undefined)) {
          instanceToAdd = settings.instance
        }
        // make sure we only initialize the channels for this instance
        if (instanceToAdd === forInstanceID) {
          self.log.debug('[Server] try adding %s to bridge %s', program.name, forInstanceID)
          let Appliance = require(clazZFile)
          if (settings === undefined) {
            settings = {}
          }
          let accessory = new Appliance(program, 'Program', self, settings)
          // save the variable
          // accessory.variable = self._ccu.variableWithName(program.name)
          accessory.init()
          accessory.instanceID = forInstanceID
          accessory.serviceClass = sClass
          accessory.settings = settings
          this.addAccessory(accessory, bridge, publish)
        }
      })
    )
  }

  _loadAccessories (channelList, forInstanceID, bridge, publish) {
    let self = this
    return Promise.all(
      channelList.map(channel => {
        let sClass = self._findServiceClass(channel)
        if (sClass) {
          let settings = self._configuration.mappings[channel.address]
          var instanceToAdd = uuid.generate('0') // default is Instance 0
          // if there are settings ... use instances from settings
          if ((settings !== undefined) && (settings.instance !== undefined)) {
            instanceToAdd = settings.instance
          }
          // make sure we only initialize the channels for this instance
          if (instanceToAdd === forInstanceID) {
            self.log.debug('[Server] try adding %s to bridge %s', channel.name, forInstanceID)
            let oInterface = self._ccu.getInterfaceWithID(channel.intf)
            if (oInterface) {
              oInterface.inUse = true
              self.log.debug('[Server] serivce used for %s is %s', channel.name, sClass)
              // Init the service class and create a appliance object
              try {
                let clazZFile = path.join(__dirname, 'services', sClass + '.js')
                if (fs.existsSync(clazZFile)) {
                  let Appliance = require(clazZFile)
                  let channelTypes = Appliance.channelTypes()
                  if (channelTypes.indexOf(channel.type) > -1) {
                    let accessory = new Appliance(channel, oInterface.name, self, settings)
                    accessory.init()
                    accessory.instanceID = forInstanceID
                    accessory.serviceClass = sClass
                    accessory.settings = settings
                    // add the accessory to the bridge
                    if (publish === true) {
                      self.log.info('[Server] add %s to bridge instance %s', channel.name, forInstanceID)
                    }
                    self.addAccessory(accessory, bridge, publish)
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
          // not my instance
          }
        } else {
          self.log.warn('[Server] there is no known service for %s:%s on channel %s', channel.dtype, channel.type, channel.address)
        }
      })
    )
  }
}

module.exports = Server
