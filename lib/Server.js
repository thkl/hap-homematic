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
    this._configuration = {subsection: 'HomeKit'}
    this._bridges = {}
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

  init () {
    this.log.info('[Server] Using config from %s', this._hapCache)
    HAP.init(this._hapCache)
    this._ccu = new HomeMaticCCU(this.log, this._configuration)
    this.connectCCU()
    this.launchUIConfigurationServer()
  }

  connectCCU () {
    let self = this
    self._ccu.connect().then(() => {
      self._ccu.fetchDevices().then(c => {
      // Check Instances to power up
        let lInstances = this._configuration.instances || [0]
        lInstances.map(async function (instanceID) {
          self._bridges[instanceID] = await self.loadInstance(instanceID, c)
        })
        self.log.debug('[Server] preparing interface communication to ccu')
        self._ccu.prepareInterfaces()
        self.log.debug('[Server] publishing accessories')
        self.publishAccessoriesToConfigurationService()
      })
    })
  }

  async loadInstance (instId, ccuDevices) {
    let self = this
    return new Promise((resolve, reject) => {
      let instanceName = 'HomeMatic_' + self.pad(instId, 2)
      let username = this.getMacWithInstanceID(self.pad(instId, 2))
      self.log.info('[Server] powering up bridge : %s with userid %s', instanceName, username)
      let bridge = new Bridge(instanceName, uuid.generate(instanceName))
      // load Channels and Build accessories
      self.log.debug('[Server] loading devices for instance %s', instId)
      self._loadAccessories(ccuDevices, instId, bridge)
      let info = bridge.getService(Service.AccessoryInformation)
      info.setCharacteristic(Characteristic.Manufacturer, 'HAP-Homematic by thkl')
      info.setCharacteristic(Characteristic.Model, `HomeMatic`)
      info.setCharacteristic(Characteristic.SerialNumber, instanceName)
      info.setCharacteristic(Characteristic.FirmwareRevision, '0.1')

      var publishInfo = {
        username: username,
        port: 9876 + instId,
        pincode: '031-45-154',
        category: Accessory.Categories.BRIDGE,
        mdns: true
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
      resolve(bridge)
    })
  }

  async loadSettings () {
    let self = this
    let configFileName = path.join(this._configurationPath, 'config.json')
    if (fs.existsSync(configFileName)) {
      this._configuration = JSON.parse(fs.readFileSync(configFileName).toString())
    }

    // load dynamic classes
    var serviceConfig = await this.buildServiceList()

    if (!this._configuration.mappings) {
      this._configuration.mappings = {}
    }

    // merge service mappings from user settings with internal config
    Object.keys(serviceConfig).map(key => {
      self._configuration.mappings[key] = serviceConfig[key]
    })
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
            if ((channelTypes) && (channelTypes.length > 0)) {
              channelTypes.map(channelType => {
                self.log.debug('[Serer] addings %s for channelType ', channelType)
                serviceConfig[channelType] = serviceName
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

  getMacWithInstanceID (instanceId) {
    var result = '00:11:22:33:44:55'
    var interfaces = require('os').networkInterfaces()
    for (var devName in interfaces) {
      var iface = interfaces[devName]
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i]
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && (alias.address.indexOf('169.254.') === -1)) {
          result = alias.mac
        }
      }
    }
    this.log.debug('[Server] mac is %s', result)
    // change the first octed to the instanceID
    result = this.pad(instanceId, 2) + result.substr(2)
    return result
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

  addAccessory (accessory, bridge) {
    let acUID = accessory.getUUID()
    if (this._publishedAccessories[acUID] === undefined) {
      this.log.debug('[Server] adding accessory %s', accessory.getName())

      bridge.addBridgedAccessory(accessory.getHomeKitAccessory())
      accessory.getHomeKitAccessory().updateReachability(true)
      this._publishedAccessories[acUID] = accessory
    } else {
      this.log.error('[Server] Unable to add a accessory with the same uuid %s as one added before', acUID)
    }
  }

  publishAccessoriesToConfigurationService () {
    var data = []
    let self = this
    Object.keys(self._publishedAccessories).forEach(function (advertiseAddress) {
      data.push(self._publishedAccessories[advertiseAddress]._dictionaryPresentation())
    })
    if (this.configUI) {
      this.configUI.send({
        topic: 'accessories',
        accessories: data
      })
    }
  }

  shutdownBridgeInstances () {
    let self = this
    Object.keys(this._bridges).map(instanceID => {
      self.log.info('[Server] shutting down Homekit bridge %s', instanceID)
      self._bridges[instanceID].unpublish()
    })

    Object.keys(self._publishedAccessories).forEach(function (advertiseAddress) {
      self._publishedAccessories[advertiseAddress].getHomeKitAccessory().unpublish()
      self._publishedAccessories[advertiseAddress].shutdown()
    })
    this._bridges = {}
    this._publishedAccessories = {}
  }

  shutdown () {
    this.log.info('[Server] shutting down all homekit instances')
    this.shutdownBridgeInstances()

    setTimeout(function () {
      process.exit()
    }, 1000)

    this._ccu.shutdown()
    this.log.info('[Server] bye')
  }

  launchUIConfigurationServer () {
    let self = this
    process.env.UIX_CONFIG_PATH = this._configurationPath

    this.configUI = childProcess.fork(path.resolve(__dirname, 'configurationsrv'), null, {
      env: process.env
    })

    this.log.info('Spawning configuration service with PID', this.configUI.pid)

    this.configUI.on('message', (message) => {
      self._handleIncommingIPCMessage(message)
    })
  }

  async _reloadAppliances () {
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

    sClass = mappings[channel.type]
    if (sClass) {
      this.log.debug('[Server] service %s found thru channeltype %s', sClass, channel.type)
      return sClass
    }

    return undefined
  }

  _loadAccessories (channelList, forInstanceID, bridge) {
    let self = this
    channelList.map(channel => {
      let sClass = self._findServiceClass(channel)
      if (sClass) {
        let settings = self._configuration.mappings[channel.address]
        var instanceToAdd = 0 // default is Instance 0
        // if there are settings ... use instances from settings
        if ((settings !== undefined) && (settings.instance !== undefined)) {
          instanceToAdd = parseInt(settings.instance)
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
                  self.log.info('[Server] add %s to bridge instance %s', channel.name, forInstanceID)
                  // add the accessory to the bridge
                  self.addAccessory(accessory, bridge)
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
  }
}

module.exports = Server
