const uuid = require('hap-nodejs').uuid
const Bridge = require('hap-nodejs').Bridge
const HAP = require('hap-nodejs')
const Accessory = require('hap-nodejs').Accessory
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const path = require('path')
const fs = require('fs')
const qrcode = require('qrcode-terminal')
const HomeMaticCCU = require(path.join(__dirname, 'HomeMaticCCU.js'))

class Server {
  constructor (log, configurationPath) {
    this.log = log
    this._configurationPath = configurationPath
    this._hapCache = path.join(configurationPath, 'persist')
    this._publishedAccessories = {}
    this._username = this.getMac()
    this._configuration = {subsection: 'HomeKit'}
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

  loadSettings () {
    let self = this
    let configFileName = path.join(this._configurationPath, 'config.json')
    if (fs.existsSync(configFileName)) {
      this._configuration = JSON.parse(fs.readFileSync(configFileName).toString())
    }
    var serviceConfig = {}
    let serviceConfigFile = path.join(__dirname, 'services', 'config.json')
    if (fs.existsSync(serviceConfigFile)) {
      serviceConfig = JSON.parse(fs.readFileSync(serviceConfigFile).toString())
    }

    if (!this._configuration.mappings) {
      this._configuration.mappings = {}
    }

    // merge service mappings from user settings with internal config
    Object.keys(serviceConfig).map(key => {
      self._configuration.mappings[key] = serviceConfig[key]
    })
  }

  getMac () {
    var interfaces = require('os').networkInterfaces()
    for (var devName in interfaces) {
      var iface = interfaces[devName]
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i]
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && (alias.address.indexOf('169.254.') === -1)) {
          return alias.mac
        }
      }
    }
    return '00:11:22:33:44:55'
  }

  saveAccessories () {

  }

  addAccessory (accessory) {
    let self = this
    let acUID = accessory.getUUID()
    if (this._publishedAccessories[acUID] === undefined) {
      this.log.debug('[Server] adding accessory %s', accessory.getName())
      this._bridge.addBridgedAccessory(accessory.getHomeKitAccessory())
      this._publishedAccessories[acUID] = accessory
      accessory.on('server_reload', () => {
        self.reloadAccessories()
      })
    } else {
      this.log.error('[Server] Unable to add a accessory with the same uuid %s as one added before', acUID)
    }
  }

  reloadAccessories () {
    let self = this
    Object.keys(self._publishedAccessories).forEach(function (advertiseAddress) {
      self._publishedAccessories[advertiseAddress].shutdown()
    })
    self._publishedAccessories = {}
    self._ccu.shutdown()
    self._ccu.fetchDevices().then(c => {
      self._loadAccessories(c)
      self._ccu.connectInterfaces()
    })
  }

  shutdown () {
    let self = this
    this.log.info('[Server] shutting down')
    this._bridge.unpublish()
    Object.keys(self._publishedAccessories).forEach(function (advertiseAddress) {
      self._publishedAccessories[advertiseAddress].getHomeKitAccessory().unpublish()
      self._publishedAccessories[advertiseAddress].shutdown()
    })
    setTimeout(function () {
      process.exit()
    }, 1000)
    this._ccu.shutdown()
    this.log.info('[Server] bye')
  }

  async init () {
    let self = this
    self.log.info('[Server] Using config from %s', this._hapCache)
    HAP.init(this._hapCache)
    self._bridge = new Bridge('HomeMatic', uuid.generate('HomeMatic'))
    self._ccu = new HomeMaticCCU(self.log, self._configuration)
    self._ccu.connect().then(o => {
      // load Channels and Build accessories
      self._ccu.fetchDevices().then(c => {
        self._loadAccessories(c)
        self._ccu.connectInterfaces()
        self._publish()
      })
    })

    let info = self._bridge.getService(Service.AccessoryInformation)
    info.setCharacteristic(Characteristic.Manufacturer, 'HAP-Homematic by thkl')
    info.setCharacteristic(Characteristic.Model, `HomeMatic`)
    info.setCharacteristic(Characteristic.SerialNumber, this._username)
    info.setCharacteristic(Characteristic.FirmwareRevision, '0.1')

    self._bridge.on('listening', port => {
      self.log.info('[Server] hap-homematic is running on port %s.', port)
    })

    self._bridge.on('pair', username => {
      self.log.info('[Server] pairing %s', username)
    })

    self._bridge.on('unpair', username => {
      self.log.info('[Server] remove pairing %s', username)
    })

    self._bridge.on('identify', (paired, callback) => {
      self.log.info('[Server] identify %s', paired ? '-paired-' : '-not paired-')
      callback()
    })
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

  _loadAccessories (channelList) {
    let self = this
    channelList.map(channel => {
      let sClass = self._findServiceClass(channel)
      if (sClass) {
        let oInterface = self._ccu.getInterfaceWithID(channel.intf)
        if (oInterface) {
          oInterface.inUse = true
          let Appliance = require(path.join(__dirname, 'services', sClass + '.js'))
          let settings = self._configuration.mappings[channel.address]
          let accessory = new Appliance(channel.name, oInterface.name, channel.address, channel.type, self, settings)
          accessory.init()
          self.addAccessory(accessory)
        }
      } else {
        self.log.warn('[Server] there is no known service for %s:%s on channel %s', channel.dtype, channel.type, channel.address)
      }
    })
  }

  _publish () {
    let self = this
    var publishInfo = {
      username: self._username,
      port: 9875,
      pincode: '031-45-154',
      category: Accessory.Categories.BRIDGE,
      mdns: true
    }

    self._bridge.publish(publishInfo, false)
    self.log.info('[Server] Your Bridge ID %s PinCode is %s', publishInfo.username, publishInfo.pincode)
    self.log.info('Scan this code with your HomeKit app on your iOS device to pair with Homebridge:')
    qrcode.generate(self._bridge.setupURI())
  }
}

module.exports = Server
