const uuid = require('hap-nodejs').uuid
const Accessory = require('hap-nodejs').Accessory
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const path = require('path')
const os = require('os')
const HomeMaticAddress = require(path.join(__dirname, '..', 'HomeMaticAddress.js'))

class HomeMaticAccessory {
  constructor (name, sInterface, serial, ccuType, server) {
    let self = this
    name = name.replace(/[.:#_()-]/g, ' ')
    this._server = server
    this._name = name
    this.log = server.log
    this._serial = serial.split(':').slice(0, 1)
    this._channelnumber = serial.split(':').slice(1, 2)
    this._ccuType = ccuType
    this._ccu = server._ccu
    this._interf = sInterface
    this._accessoryUUID = uuid.generate(this._ccuType + ':' + this._name)
    this.homeKitAccessory = new Accessory(this._name, this._accessoryUUID)
    this.homeKitAccessory.on('identify', (paired, callback) =>
      self.identify(paired, callback)
    )
    this.homeKitAccessory.log = this.log
    // this is only a dummy so fakegato will work
    this.gatoHomeBridge = server.gatoHomeBridge
  }

  getHomeKitAccessory () {
    return this.homeKitAccessory
  }

  getManufacturer () {
    return 'HAP-Homematic By Thkl'
  }

  getName () {
    return this._name
  }

  publishServices (Service, Characteristic) {
    this.log.warn('[Generic] u should override this to create your accessory')
  }

  getUUID () {
    return this._accessoryUUID
  }

  shutdown () {
    clearTimeout(this.setDelayTimer)
  }

  getService (name) {
    let service = this.homeKitAccessory.getService(name)
    if (service) {
      this.log.debug('[Generic] get Service')
      return service
    } else {
      this.log.debug('[Generic] add Service')
      service = this.homeKitAccessory.addService(name)
      return service
    }
  }

  init () {
    this.log.debug('[Generic] publishing services for %s', this.getName())
    this._configureInformationService()
    this.publishServices(Service, Characteristic)
  }

  identify (paired, callback) {
    this.log.info('[Generic] identifying paired %s', paired)
    if (callback) {
      callback()
    }
  }

  setValueDelayed (address, newValue, delay = 100) {
    clearTimeout(this.setDelayTimer)
    let self = this
    this.setDelayTimer = setTimeout(() => {
      self.setValue(address, newValue)
    }, delay)
  }

  setValue (address, newValue) {
    let self = this
    var adr = address
    if (typeof address === 'string') {
      adr = self.buildAddress(address)
    }
    return this._ccu.setValue(adr.address(), newValue)
  }

  getValue (address, ignoreCache) {
    let self = this
    let adr = self.buildAddress(address)
    this.log.debug('[Generic] getValue %s', adr.address())
    return this._ccu.getValue(adr.address(), ignoreCache)
  }

  enableLoggingService (type, disableTimer) {
    if (this.runsInTestMode === true) {
      this.log.debug('[Generic] Skip Loging Service for %s because of testmode', this._name)
    } else {
      if (disableTimer === undefined) {
        disableTimer = true
      }
      var FakeGatoHistoryService = require('fakegato-history')(this.gatoHomeBridge)
      this.log.debug('[Generic] Adding Log Service for %s with type %s', this._name, type)
      var hostname = os.hostname()
      let filename = hostname + '_' + this._serial + '_' + this._channelnumber + '_persist.json'
      this.loggingService = new FakeGatoHistoryService(type, this.homeKitAccessory, {
        storage: 'fs',
        filename: filename,
        path: this._server._configurationPath,
        disableTimer: disableTimer
      })
    }
  }

  /**
     * adds a characteristic to the current logging service
     * @param  {[type]} aCharacteristic [description]
     * @return {[type]}                 [description]
     */
  addLoggingCharacteristic (aCharacteristic) {
    if ((this.runsInTestMode === true) || (this.loggingService === undefined)) {
      this.log.debug('[Generic] adding Characteristic skipped for %s because of testmode ', this._name)
    } else {
      this.loggingService.addOptionalCharacteristic(aCharacteristic)
    }
  }

  /**
     * returns a characteristic from the current logging service
     * @param  {[type]} aCharacteristic [description]
     * @return {[type]}                 [description]
     */
  getLoggingCharacteristic (aCharacteristic) {
    if ((this.runsInTestMode === true) || (this.loggingService === undefined)) {
      this.log.debug('[Generic] get Characteristic not available for %s because of testmode', this._name)
      return undefined
    } else {
      return this.loggingService.getCharacteristic(aCharacteristic)
    }
  }

  /**
     * adds a log entry
     * @param  {[type]} data {key:value}
     * @return {[type]}      [description]
     */
  addLogEntry (data) {
    // check if loggin is enabled
    if ((this.loggingService !== undefined) && (data !== undefined)) {
      let moment = require('moment')
      data.time = moment().unix()
      // check if the last logentry was just recently and is the same as the previous
      var logChanges = true
      // there is a previous logentry, let's compare...
      if (this.lastLogEntry !== undefined) {
        this.log.debug('[Generic] addLogEntry lastLogEntry is  available')
        logChanges = false
        // compare data
        var self = this
        Object.keys(data).forEach(key => {
          if (key === 'time') {
            return
          }
          // log changes if values differ
          if (data[key] !== self.lastLogEntry[key]) {
            self.log.debug('[Generic] lastLogEntry is different')
            logChanges = true
          }
        })
        // log changes if last log entry is older than 7 minutes,
        // homematic usually sends updates evry 120-180 seconds
        if ((data.time - self.lastLogEntry.time) > 7 * 60) {
          logChanges = true
        }
      }

      if (logChanges) {
        this.log.debug('[Generic] Saving log data for %s: %s', this._name, JSON.stringify(data))
        this.loggingService.addEntry(data)
        this.lastLogEntry = data
      } else {
        this.log.debug('[Generic] log did not change %s', this._name)
      }
    }
  }

  registeraddressForEventProcessingAtAccessory (address, callback) {
    this._ccu.registeraddressForEventProcessingAtAccessory(address.address(), callback)
  }

  buildAddress (dp) {
    this.log.debug('[Generic] buildAddress %s', dp)

    if ((dp) && (typeof dp === 'string')) {
      var pos = dp.indexOf('.')
      if (pos === -1) {
        this.log.debug('[Generic] seems to be a single datapoint')
        let result = new HomeMaticAddress(this._interf, this._serial, this._channelnumber, dp)
        return result
      }

      let rgx = /([a-zA-Z0-9-]{1,}).([a-zA-Z0-9-]{1,}):([0-9]{1,}).([a-zA-Z0-9-_]{1,})/g
      let parts = rgx.exec(dp)
      if ((parts) && (parts.length > 4)) {
        let intf = parts[1]
        let address = parts[2]
        let chidx = parts[3]
        let dpn = parts[4]
        this.log.debug('[Generic] try I.A:C.D Format |I:%s|A:%s|C:%s|D:%s', intf, address, chidx, dpn)
        return new HomeMaticAddress(intf, address, chidx, dpn)
      } else {
        // try format channel.dp
        let rgx = /([0-9]{1,}).([a-zA-Z0-9-_]{1,})/g
        let parts = rgx.exec(dp)
        if ((parts) && (parts.length === 3)) {
          let chidx = parts[1]
          let dpn = parts[2]
          this.log.debug('[Generic] match C.D Format |I:%s|A:%s|C:%s|D:%s', this._interf, this._serial, chidx, dpn)
          return new HomeMaticAddress(this._interf, this._serial, chidx, dpn)
        }
      }
    } else {
      this.log.error('[Generic] unable create HM Address from undefined Input %s', JSON.parse(dp))
    }
  }

  isTrue (value) {
    var result = false
    if ((typeof value === 'string') && (value.toLocaleLowerCase() === 'true')) {
      result = true
    }
    if ((typeof value === 'string') && (value.toLocaleLowerCase() === '1')) {
      result = true
    }

    if ((typeof value === 'number') && (value === 1)) {
      result = true
    }

    if ((typeof value === 'boolean') && (value === true)) {
      result = true
    }

    return result
  }

  _configureInformationService () {
    let informationService = this.getService(Service.AccessoryInformation)
    informationService.setCharacteristic(Characteristic.Manufacturer, this.getManufacturer())
    informationService.setCharacteristic(Characteristic.Model, this._ccuType)
    informationService.setCharacteristic(Characteristic.SerialNumber, os.hostname() + '_' + this._serial)
  }

  _dictionaryPresentation () {
    var result = {}

    result.displayName = this.displayName
    result.UUID = this.getUUID()

    var services = []
    var linkedServices = {}
    for (var index in this.services) {
      var service = this.services[index]
      var servicePresentation = {}
      servicePresentation.displayName = service.displayName
      servicePresentation.UUID = service.UUID
      servicePresentation.subtype = service.subtype

      var linkedServicesPresentation = []
      for (var linkedServiceIdx in service.linkedServices) {
        var linkedService = service.linkedServices[linkedServiceIdx]
        linkedServicesPresentation.push(linkedService.UUID + (linkedServices.subtype || ''))
      }
      linkedServices[service.UUID + (service.subtype || '')] = linkedServicesPresentation

      var characteristics = []
      for (var cIndex in service.characteristics) {
        var characteristic = service.characteristics[cIndex]
        var characteristicPresentation = {}
        characteristicPresentation.displayName = characteristic.displayName
        characteristicPresentation.UUID = characteristic.UUID
        characteristicPresentation.props = characteristic.props
        characteristicPresentation.value = characteristic.value
        characteristicPresentation.eventOnlyCharacteristic = characteristic.eventOnlyCharacteristic
        characteristics.push(characteristicPresentation)
      }

      servicePresentation.characteristics = characteristics
      services.push(servicePresentation)
    }

    result.linkedServices = linkedServices
    result.services = services
    result.name = this._name
    result.interface = this._interf
    result.serial = this._serial
    result.channel = this._channelnumber
    result.type = this._ccuType
    return result
  }
}

module.exports = HomeMaticAccessory
