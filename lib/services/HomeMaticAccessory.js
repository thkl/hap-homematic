/*
 * File: HomeMaticAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 7th March 2020 1:19:40 pm
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

const path = require('path')
const os = require('os')
const util = require('util')
const fs = require('fs')
const uuid = require('hap-nodejs').uuid
const Accessory = require('hap-nodejs').Accessory
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const EveHomeKitTypes = require(path.join(__dirname, 'EveHomeKitTypes.js'))
const HomeMaticAddress = require(path.join(__dirname, '..', 'HomeMaticAddress.js'))
const EventEmitter = require('events')
const moment = require('moment')

// Abstract Super Class

class HomeMaticAccessory extends EventEmitter {
  constructor(channel, sInterface, server, settings = {}) {
    super()
    this.runsInTestMode = server.isTestMode
    this._server = server
    let serial = channel.address
    this._settings = settings
    this.log = server.log
    this.isPublished = false
    this._serial = serial.split(':').slice(0, 1)[0]
    this._channelnumber = serial.split(':').slice(1, 2)[0]
    this._ccuType = channel.type
    this._deviceType = channel.dtype
    this._deviceName = channel.dname
    this._ccu = server._ccu
    this._ccuChannelId = channel.id
    this._interf = sInterface
    this._access = channel.access
    this._persistentValues = {}
    if (!this.runsInTestMode) {
      this._persistentStore = path.join(this._server._configurationPath, os.hostname() + '_' + this._serial + '_' + this._channelnumber + '.pstore')
    }
    if (settings.name) {
      this._name = settings.name
    } else {
      // Check if the Channel Name is like the Address äö
      let cDefaultName = this._deviceType + ' ' + this._serial + ':' + this._channelnumber
      let idx = cDefaultName.indexOf(channel.name)
      this.debugLog('Checking defaultname %s vs %s -> %s', cDefaultName, channel.name, idx)
      if (idx === -1) {
        this.debugLog('will use the chanel name')
        this._name = channel.name.replace(/[.:#_()]/g, ' ')
      } else {
        this.debugLog('will use the device name')
        if (this._deviceName) {
          this._name = this._deviceName.replace(/[.:#_()]/g, ' ')
        } else {
          // giving up
          this._name = this._serial
        }
      }
    }
    this._accessoryUUID = this.generateUUID(this._ccuType + ':' + this._name)
  }

  /**
   *  initialize the accessory
  */
  init() {
    this.debugLog('creating homekit accessory %s', this.getName())
    // make this overridable
    this.createHomeKitAccessory()
    // this is only a dummy so fakegato will work
    this.gatoHomeBridge = this._server.gatoHomeBridge
    // the eve HomeKitType Lib expects this structure
    this.eve = new EveHomeKitTypes(this.gatoHomeBridge.hap)
    this.loadPersistentValues()
    this.services = []
    this._configureInformationService()
    this.initialQuery = true
    this.serviceSettings = this.initServiceSettings(Characteristic)
    this.initAccessoryService(Service)
    this.publishServices(Service, Characteristic)
    this.monitorReachability()
  }

  initAccessoryService(Service) {
    // Stub
  }

  createHomeKitAccessory() {
    let self = this
    this.debugLog('publishing services for %s', this.getName())

    this.homeKitAccessory = new Accessory(this._name, this._accessoryUUID)
    this.homeKitAccessory.on('identify', (paired, callback) =>
      self.identify(paired, callback)
    )

    this.homeKitAccessory.log = this.log
  }

  isBridgedAccessory() {
    return true
  }

  generateUUID(key) {
    return uuid.generate(key)
  }

  address() {
    return this._serial + ':' + this._channelnumber
  }

  isReadOnly() {
    let roChannel = this.deviceServiceSettings('roChannel')
    let result = this.isChannelReadOnly(roChannel)
    this.debugLog('check RO %s is %s', roChannel, result)
    return result
  }

  /*
  this will add the current classname and serial to the debug log output
  */
  debugLog() {
    let msg = '[' + this.constructor.name + '] ' + this._serial + ' '
    let logMsg = util.format.apply(util, Array.prototype.slice.call(arguments))
    this.log.debug(msg + logMsg)
  }

  warnLog() {
    let msg = '[' + this.constructor.name + '] ' + this._serial + ' '
    let logMsg = util.format.apply(util, Array.prototype.slice.call(arguments))
    this.log.warn(msg + logMsg)
  }

  errorLog() {
    let msg = '[' + this.constructor.name + '] ' + this._serial + ' '
    let logMsg = util.format.apply(util, Array.prototype.slice.call(arguments))
    this.log.error(msg + logMsg)
  }

  isChannelReadOnly(channelNum) {
    if (channelNum === undefined) {
      this.debugLog('access level is %s', this._access)
      if (this._access) {
        return (this._access) ? parseInt(this._access) !== 255 : true
      } else {
        return false
      }
    } else {
      // get the channel from CCU
      let channel = this._ccu.getChannelByAddress(this._serial + ':' + channelNum)
      if (channel) {
        this.debugLog('check channel %s access level is %s', channelNum, channel.access)
        if (channel.access) {
          return (channel.access) ? parseInt(channel.access) !== 255 : true
        } else {
          return false
        }
      }
    }
    return true
  }

  /**
 * this will return the HomeKit Accessory
 */

  getHomeKitAccessory() {
    return this.homeKitAccessory
  }

  getManufacturer() {
    return 'HAP-Homematic By Thkl'
  }

  getName() {
    return this._name
  }

  getDeviceSettings(key, returnEmpty = false) {
    if (key === undefined) {
      if (this._settings) {
        return this._settings.settings || {}
      } return {}
    } else {
      if ((this._settings) && (this._settings.settings)) {
        let tmp = this._settings.settings[key]
        if ((tmp === '') && (returnEmpty === true)) {
          return tmp
        } else {
          return tmp
        }
      } else {
        return undefined
      }
    }
  }
  /**
   * this is a stub; extended classes should implement this to create the homekit services and alle the magic
   * @param {*} Service
   * @param {*} Characteristic
   */
  publishServices(Service, Characteristic) {
    this.log.warn('[Generic] u should override this to create your accessory')
  }

  getPublishInfo() {
    return {}
  }

  getPort() {
    return this.port
  }

  publishSingleAccessory(port) {
    this.port = port
    this.homeKitAccessory.port = this.getPort()
    this.homeKitAccessory.publish(this.getPublishInfo(), false)
  }

  getUUID() {
    return this._accessoryUUID
  }

  removeData() {
    // we do not have persistent data in test mode
    if (!this.runsInTestMode) {
      // clean eve history
      if (this.loggingService) {
        this.debugLog('removing history data')
        this.loggingService.cleanPersist()
      }
      // remove persistent store
      if (fs.existsSync(this._persistentStore)) {
        this.debugLog('removing persistent data')
        fs.unlinkSync(this._persistentStore)
      }
    }
  }
  /**
   * shuts down the accessory this will be called from the server on reload and shutdown
   * override this to clear all the timers
   */
  shutdown() {
    clearTimeout(this.setDelayTimer)
  }

  /**
   * this will return a value for key for a specified device type. if there are no specified settings * will be used
   * @param {key used by settings} key
   */
  deviceServiceSettings(key, subkey) {
    if (this.serviceSettings === undefined) {
      this.log.warn('[Generic] no serviceSettings defined')
      return undefined
    }
    // first try the channel Type - HmIP-BLA:CONTACT
    let oDeviceSettings = this.serviceSettings[this._deviceType + ':' + this._ccuType]

    // if not the channel type -  CONTACT
    if (oDeviceSettings === undefined) {
      oDeviceSettings = this.serviceSettings[this._ccuType]
    }

    // if not the device type - HmIP-BLA
    if (oDeviceSettings === undefined) {
      oDeviceSettings = this.serviceSettings[this._deviceType]
    }

    // if not use the *
    if (oDeviceSettings === undefined) {
      oDeviceSettings = this.serviceSettings['*']
    }

    if ((subkey === undefined) || (subkey === null)) {
      if (oDeviceSettings !== undefined) {
        return oDeviceSettings[key]
      } else {
        this.log.debug('[Generic] no key %s found in %s', key, JSON.stringify(oDeviceSettings))
        return undefined
      }
    } else {
      if (oDeviceSettings[subkey] !== undefined) {
        return oDeviceSettings[subkey][key]
      } else {
        this.log.debug('[Generic] no key %s for subkey section %s found in %s', key, subkey, JSON.stringify(oDeviceSettings))
        return undefined
      }
    }
  }

  deviceServiceSettingsFromTemplate(key, subkey, templateSettings) {
    let tmp = this.deviceServiceSettings(key, subkey)
    if (templateSettings) {
      Object.keys(templateSettings).map((tKey) => {
        tmp = tmp.replace('%' + tKey + '%', templateSettings[tKey])
      })
    }
    return tmp
  }

  initServiceSettings() {
    return {}
  }
  /**
   * returns the Service with name ... from the homekit accessor
   * if there is none , the service will be created
   * @param {*} name
   */
  getService(serviceType, name = this._name, forceAdd = false, subtype = '', makeTestFailed = false) {
    let service = this.homeKitAccessory.getService(serviceType, name, subtype)
    if ((!service) || (forceAdd === true)) {
      if (makeTestFailed) {
        this.log.warn('[Generic] add Service will fail')
        return null
      }
      service = this.homeKitAccessory.addService(serviceType, name, serviceType.UUID, subtype)
    }
    if (subtype !== '') { // this is a dirty fix .. but hey it works
      service.subtype = subtype
    }
    var nameCharacteristic =
      service.getCharacteristic(Characteristic.Name) ||
      service.addCharacteristic(Characteristic.Name)
    nameCharacteristic.setValue(name)
    return service
  }

  addService(service) {
    if (this.homeKitAccessory.getService(service) === undefined) {
      this.homeKitAccessory.addService(service)
    }
    return service
  }
  // maps the  value depending on the servicesettings
  getDataPointResultMapping(type, subkey, value, mapTable = 'mapping', reverse = false) {
    let settings = this.deviceServiceSettings(type, subkey)
    let mappingtable = settings[mapTable]

    let testValue = value
    if ((typeof settings === 'object') && (mappingtable)) {
      this.debugLog('Mapping - Table found')
      if (settings.number) {
        // change the value into boolean
        testValue = parseInt(value)
      }
      if (settings[mapTable]) {
        if (settings.boolean) {
          // change the value into string
          testValue = this.isTrue(value)
          testValue = testValue ? 'true' : 'false'
          this.debugLog('mapping boolean to string %s', JSON.stringify(testValue))
        }
        if (reverse === true) {
          var rResult
          Object.keys(mappingtable).map(key => {
            if (mappingtable[key] === testValue) {
              rResult = key
            }
          })
          return rResult
        } else {
          if (mappingtable[testValue] !== undefined) {
            this.debugLog('mapping result found ...')
            return mappingtable[testValue]
          } else {
            this.debugLog('no value in mappingtable %s returning input', JSON.stringify(mappingtable))
            return value
          }
        }
      } else {
        this.debugLog('no mapping table return input')
        return value
      }
    } return value
  }

  /**
   * return a datapoint name from settings matrix
   * @param {*} type
   * @param {*} subkey
   */
  getDataPointNameFromSettings(type, subkey) {
    let result = this.deviceServiceSettings(type, subkey)
    if (!result) {
      return undefined
    }
    if (typeof result === 'string') {
      return result
    } else {
      return result.name
    }
  }

  getDataPointValueFromSettings(type, subkey) {
    let result = this.deviceServiceSettings(type, subkey)
    if (!result) {
      return undefined
    }
    if (typeof result === 'string') {
      return result
    } else {
      return result.value
    }
  }

  /**
   * gets called by the identify event ..
   * you may override this to let your device do blinkenlights
   * @param {*} paired
   * @param {*} callback
   */
  identify(paired, callback) {
    this.log.info('[Generic] identifying %s. paired %s', this._name, paired)
    if (callback) {
      callback()
    }
  }

  /**
   * sets a value at the ccu with a delay
   * @param {*} address
   * @param {*} newValue
   * @param {*} delay
   */
  setValueDelayed(address, newValue, delay = 100) {
    clearTimeout(this.setDelayTimer)
    let self = this
    this.setDelayTimer = setTimeout(() => {
      self.setValue(address, newValue)
    }, delay)
  }

  /**
   * sets value to a datapoint at the ccu
   * @param {*} address
   * @param {*} newValue
   */
  setValue(address, newValue) {
    let self = this
    var adr = address
    if (typeof address === 'string') {
      adr = self.buildAddress(address)
    }
    if ((adr) && (adr.address())) {
      return this._ccu.setValue(adr.address(), newValue)
    } else {
      return false
    }
  }

  /**
   * sets a Datapoint Value based on the device configuration mask
   * @param {*} settingsKey
   * @param {*} subkey
   * @param {*} newValue
   */
  setValueForDataPointNameWithSettingsKey(settingsKey, subkey, newValue) {
    let realDataPointName = this.getDataPointNameFromSettings(settingsKey, subkey)
    return this.setValue(realDataPointName, newValue)
  }

  getValue(address, ignoreCache) {
    let self = this
    let adr = self.buildAddress(address)
    this.debugLog('getValue %s (%s)', adr.address(), ignoreCache)
    if (adr.variable()) {
      return this._ccu.getVariableValue(adr.variable())
    } else {
      if ((adr) && (adr.address())) {
        return this._ccu.getValue(adr.address(), ignoreCache)
      } else {
        return false
      }
    }
  }

  /**
   * gets a datapoint value  based on the device configuration mask
   * @param {*} settingsKey
   * @param {*} subkey
   * @param {*} ignoreCache
   */
  getValueForDataPointNameWithSettingsKey(settingsKey, subkey, ignoreCache) {
    let realDataPointName = this.getDataPointNameFromSettings(settingsKey, subkey)
    return this.getValue(realDataPointName, ignoreCache)
  }

  /**
   * adds a eve logging service to the accessory
   * @param {*} type
   * @param {*} disableTimer
   */
  enableLoggingService(type, disableTimer) {
    // make sure the loggin is only once enabled
    if (this.loggingService !== undefined) {
      this.log.error('LoggingService can only enabled once')
      return
    }

    // do no record history if the flag is set. saving calls will be ignored
    if (this._server.getConfig('disableHistory') === true) {
      this.debugLog('Skip Logging Service for %s because its disabled', this._name)
      return
    }
    if (this.runsInTestMode === true) {
      this.debugLog('Skip Logging Service for %s because of testmode', this._name)
    } else {
      if (['weather', 'energy', 'room', 'door', 'motion', 'switch', 'thermo', 'aqua'].indexOf(type) === -1) {
        this.log.warn('[Generic] logging type %s is not available', type)
        return
      } else {
        this.debugLog('enable logging service  %s for %s', type, this._name)
      }

      if (disableTimer === undefined) {
        disableTimer = false
      }

      // make the gato cache run on a usb stick
      let cachePath = this._server.getConfig('cache')

      if (cachePath !== undefined) {
        cachePath = path.join(cachePath, 'evehistory')
      } else {
        cachePath = this._server._configurationPath
      }
      try {
        if (!fs.existsSync(cachePath)) {
          fs.mkdirSync(cachePath, true)
        }

        var FakeGatoHistoryService = require('fakegato-history')(this.gatoHomeBridge)
        var hostname = os.hostname()
        let filename = hostname + '_' + this._serial + '_' + this._channelnumber + '_persist.json'
        this.loggingService = new FakeGatoHistoryService(type, this.homeKitAccessory, {
          storage: 'fs',
          filename: filename,
          path: cachePath,
          disableTimer: disableTimer,
          length: 1000
        })
        this.debugLog('Log Service for %s with type %s added timer disabled %s', this._name, type, disableTimer)
        this.services.push(this.loggingService)
      } catch (e) {
        this.log.error('Unable to enable history for %s %s', this._serial, e)
      }
    }
  }

  /**
   * adds the eve reset statistics to the service
   * @param {*} callback will be called when a reset was perfomed
   */

  addResetStatistics(service, resetCallback) {
    if ((this.runsInTestMode === false) && (service !== undefined)) {
      this.debugLog('adding Reset to %s', this._name)
      let self = this
      this.lastReset = this.getPersistentValue('lastReset', undefined)

      if (this.lastReset === undefined) {
        // Set to now
        let epoch = moment('2001-01-01T00:00:00Z').unix()
        this.lastReset = moment().unix() - epoch
        this.savePersistentValue('lastReset', this.lastReset)
      }

      service.addOptionalCharacteristic(this.eve.Characteristic.ResetTotal)
      this.resetCharacteristic = service.getCharacteristic(this.eve.Characteristic.ResetTotal)
      this.resetCharacteristic.on('set', (value, setCallback) => {
        self.debugLog('will perform a reset for %s', self._name)
        // only reset if its not equal the reset time we know
        if (value !== self.lastReset) {
          self.lastReset = value
          self.savePersistentValue('lastReset', self.lastReset)

          if (resetCallback) {
            self.debugLog('calling reset function of %s', self._name)
            resetCallback()
          }
          if (self.loggingService) {
            self.loggingService.cleanPersist()
          }
        } else {
          self.debugLog('set ResetTotal called %s its equal the last reset time so ignore', value)
        }
        if (setCallback) {
          setCallback()
        }
      })

      this.resetCharacteristic.on('get', (callback) => {
        self.debugLog('get lastReset called for %s will report  %s', self._name, self.lastReset)
        callback(null, self.lastReset)
      })

      this.resetCharacteristic.updateValue(this.lastReset, null)
      self.debugLog('reset Statistics added for %s', self._name)
    } else {
      if (!this.runsInTestMode) {
        this.log.warn('[Generic] unable to add reset to %s', this._name)
        if (this.loggingService === undefined) {
          this.log.warn('Please add the logging service before calling addResetStatistics')
        }
      }
    }
  }

  /**
     * adds a log entry
     * @param  {[type]} data {key:value}
     * @return {[type]}      [description]
     */
  addLogEntry(data) {
    // check if loggin is enabled
    if ((this.loggingService !== undefined) && (data !== undefined)) {
      data.time = moment().unix()
      // check if the last logentry was just recently and is the same as the previous
      var logChanges = true
      // there is a previous logentry, let's compare...
      if (this.lastLogEntry !== undefined) {
        this.debugLog('addLogEntry lastLogEntry is  available')
        logChanges = false
        // compare data
        var self = this
        Object.keys(data).forEach(key => {
          if (key === 'time') {
            return
          }
          // log changes if values differ
          if (data[key] !== self.lastLogEntry[key]) {
            self.debugLog('lastLogEntry is different')
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
        this.debugLog('Saving log data for %s: %s', this._name, JSON.stringify(data))
        this.loggingService.addEntry(data)
        this.lastLogEntry = data
      } else {
        this.debugLog('Log did not change %s', this._name)
      }
    }
  }

  addLastActivationService(service) {
    if ((service !== undefined) && (this.loggingService !== undefined)) {
      let self = this

      service.addOptionalCharacteristic(this.eve.Characteristic.LastActivation)
      this.lastActivationService = service.getCharacteristic(this.eve.Characteristic.LastActivation)
      this.lastActivationService.on('get', (callback) => {
        callback(null, self.lastActivation || 0);
      })
      this.lastActivation = this.getPersistentValue('lastActivation')
      if (this.lastActivation === undefined) {
        this.lastActivation = this.loggingService.getInitialTime() || 0;
        this.savePersistentValue('lastActivation', this.lastActivation)
      }
      this.lastActivationService.updateValue(this.lastActivation || 0, null)
    }
  }

  updateLastActivation() {
    if (this.lastActivationService !== undefined) {
      let firstLog = this.loggingService.getInitialTime() || moment(0).unix();
      this.lastActivation = moment().unix() - firstLog
      if ((this.lastActivation === undefined) || (isNaN(this.lastActivation))) {
        this.lastActivation = moment(0).unix();
      }
      this.lastActivationService.updateValue(this.lastActivation || 0, null)
      this.savePersistentValue('lastActivation', this.lastActivation)
    }
  }

  loadPersistentValues() {
    if (!this.runsInTestMode) {
      if (fs.existsSync(this._persistentStore)) {
        this._persistentValues = JSON.parse(fs.readFileSync(this._persistentStore).toString())
      } else {
        this._persistentValues = {}
      }
    }
  }

  async addTamperedCharacteristic(rootService, channel = 0) {
    let self = this
    if (rootService !== undefined) {
      if (rootService.testCharacteristic(Characteristic.StatusTampered)) {
        this.tamperedCharacteristic = rootService.getCharacteristic(Characteristic.StatusTampered)
      } else {
        // not added by default -> create it
        this.debugLog('added Tampered to %s', this.name)
        rootService.addOptionalCharacteristic(Characteristic.StatusTampered)
        this.tamperedCharacteristic = rootService.getCharacteristic(Characteristic.StatusTampered)
      }
      if (channel !== undefined) {
        // figure out which sabotage datapoint to use
        if (await this._ccu.hazDatapoint(this.buildAddress(channel + '.SABOTAGE'))) {
          this.tamperedCharacteristic.on('get', async callback => {
            callback(null, self.isTrue(await self.getValue(channel + '.SABOTAGE', true)))
          })

          this.registerAddressForEventProcessingAtAccessory(this.buildAddress(channel + '.SABOTAGE'), (newValue) => {
            self.tamperedCharacteristic.updateValue(self.isTrue(newValue), null)
          })
          return
        }

        if (await this._ccu.hazDatapoint(this.buildAddress(channel + '.ERROR_SABOTAGE'))) {
          this.tamperedCharacteristic.on('get', async callback => {
            callback(null, self.isTrue(await self.getValue(channel + '.ERROR_SABOTAGE', true)))
          })

          this.registerAddressForEventProcessingAtAccessory(this.buildAddress(channel + '.ERROR_SABOTAGE'), (newValue) => {
            self.tamperedCharacteristic.updateValue(self.isTrue(newValue), null)
          })
        }
      }
    }
  }

  async addLowBatCharacteristic(channel = 0) {
    // check if we have LOWBAT or LOW_BAT
    let hazLowBat = await this._ccu.hazDatapoint(this.buildAddress(channel + '.LOWBAT'))
    let hazLowBat2 = await this._ccu.hazDatapoint(this.buildAddress(channel + '.LOW_BAT'))
    if ((!hazLowBat) && (!hazLowBat2)) {
      return
    }

    let voltage = this.deviceServiceSettings('voltage')
    if (voltage) {
      let voltgeDP = this.buildAddress(channel + '.OPERATING_VOLTAGE')
      this.debugLog('check for operating voltage datapoint %s', voltgeDP.address())
      let hazVoltage = await this._ccu.hazDatapoint(voltgeDP)
      if (hazVoltage) {
        this.debugLog('found Voltage %s and Datapoint is here', voltage)
        this.addHmIPBatteryLevelStatus(undefined, undefined, voltage)
      } else {
        this.debugLog('found Voltage %s but Datapoint is not here', voltage)
        this.addHMLowBatCharacteristic(channel)
      }
    } else {
      this.addHMLowBatCharacteristic(channel)
    }
  }

  async addHMLowBatCharacteristic(channel = 0) {
    let self = this
    this.isBatLow = false
    if (this.batteryService === undefined) {
      this.batteryService = this.getService(Service.BatteryService)
    }

    if (this.batLevel === undefined) {
      this.batLevel = this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
        .on('get', (callback) => {
          callback(null, self.isBatLow ? 0 : 100)
        })
    }

    if (this.lowBatCharacteristic === undefined) {
      this.lowBatCharacteristic = this.batteryService.getCharacteristic(Characteristic.StatusLowBattery)

      if (channel !== undefined) {
        this.debugLog('adding LOW Batt stuff for %s', this._serial)

        if (await this._ccu.hazDatapoint(this.buildAddress(channel + '.LOWBAT'))) {
          this.debugLog('register LOWBAT Event for %s', this._serial)
          this.lowBatCharacteristic.on('get', async callback => {
            self.isBatLow = self.isTrue(await self.getValue(channel + '.LOWBAT', true))
            self.batLevel.updateValue(self.isBatLow ? 0 : 100, null)
            let hk = (self.isBatLow === true) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
            callback(null, hk)
          })

          this.registerAddressForEventProcessingAtAccessory(this.buildAddress(channel + '.LOWBAT'), (newValue) => {
            self.isBatLow = self.isTrue(self.isTrue(newValue))
            self.batLevel.updateValue(self.isBatLow ? 0 : 100, null)
            let hk = (self.isBatLow === true) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
            self.debugLog('LOWBAT Event for %s : %s HK Value %s', self._serial, newValue, hk)
            self.lowBatCharacteristic.updateValue(hk, null)
          })
          return
        }

        if (await this._ccu.hazDatapoint(this.buildAddress(channel + '.LOW_BAT'))) {
          this.debugLog('register LOW_BAT Event for %s', this._serial)
          this.lowBatCharacteristic.on('get', async callback => {
            self.isBatLow = self.isTrue(await self.getValue(channel + '.LOW_BAT', true))
            self.batLevel.updateValue(self.isBatLow ? 0 : 100, null)
            let hk = (self.isBatLow === true) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
            callback(null, hk)
          })

          this.registerAddressForEventProcessingAtAccessory(this.buildAddress(channel + '.LOW_BAT'), (newValue) => {
            self.isBatLow = self.isTrue(self.isTrue(newValue))
            self.batLevel.updateValue(self.isBatLow ? 0 : 100, null)
            let hk = (self.isBatLow === true) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
            self.debugLog('LOW_BAT Event for %s : %s HK Value %s', self._serial, newValue, hk)
            self.lowBatCharacteristic.updateValue(hk, null)
          })
        }
      }
    }
  }

  addHmIPBatteryLevelStatus(dpName = '0.OPERATING_VOLTAGE', dplowBat = '0.LOW_BAT', maxVoltage = 3.0) {
    let self = this

    if (this.batteryService === undefined) {
      this.debugLog('adding hmIP Battery service')
      this.batteryService = this.getService(Service.BatteryService)
    }

    if (this.levelCharacteristic === undefined) {
      this.levelCharacteristic = this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
        .on('get', (callback) => {
          self.getValue(dpName, true).then(value => {
            let level = parseFloat(value) / (parseFloat(maxVoltage) / 100)
            if (level > 100) { level = 100; }
            self.debugLog('get battery level %s', level)
            callback(null, level)
          })
        })
    }

    if (this.lowLevelCharacteristic === undefined) {
      this.lowLevelCharacteristic = this.batteryService.getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', (callback) => {
          self.getValue(dplowBat, true).then(value => {
            let hk = (self.isTrue(value) === true) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
            callback(null, hk)
          })
        })

      this.batteryService.getCharacteristic(Characteristic.ChargingState)
        .on('get', (callback) => {
          if (callback) callback(null, false)
        })

      this.registerAddressForEventProcessingAtAccessory(this.buildAddress(dplowBat), (newValue) => {
        let hk = (self.isTrue(newValue) === true) ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
        self.lowLevelCharacteristic.updateValue(hk, null)
      })

      this.registerAddressForEventProcessingAtAccessory(this.buildAddress(dpName), (newValue) => {
        let level = parseFloat(newValue) / (parseFloat(maxVoltage) / 100)
        self.debugLog('voltage is %s level %s', newValue, level)
        if (level > 100) {
          level = 100
        }
        self.updateCharacteristic(self.levelCharacteristic, level)
      })
    }
  }

  addFaultCharacteristic(rootService, hmDatapoint = '0.STICKY_UNREACH', mapping = (value) => { return self.isTrue(value) }) {
    let self = this
    var fault = rootService.getCharacteristic(Characteristic.StatusFault)

    if (fault !== undefined) {
      this.faultCharacteristic = fault
    } else {
      // not added by default -> create it
      this.debugLog('added Fault to %s', this.name)
      rootService.addOptionalCharacteristic(Characteristic.StatusFault)
      this.faultCharacteristic = rootService.getCharacteristic(Characteristic.StatusFault)
    }

    this.faultCharacteristic.on('get', callback => {
      self.getValue(hmDatapoint, true).then(value => {
        callback(null, mapping(value))
      })
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress(hmDatapoint), (newValue) => {
      self.faultCharacteristic.updateValue(mapping(newValue), null)
    })
  }

  monitorReachability() {
    let self = this
    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('0.UNREACH'), (newValue) => {
      try {
        self.homeKitAccessory.updateReachability(!self.isTrue(newValue))
      } catch (e) {

      }
    })
  }

  addStateBasedCharacteristic(service, characteristic, getStateCallback) {
    let self = this
    if (service !== undefined) {
      service.addOptionalCharacteristic(characteristic)
      let result = service.getCharacteristic(characteristic)
        .on('get', (callback) => {
          self.debugLog('getTimesOpened will report %s', getStateCallback())
          callback(null, getStateCallback())
        })
      result.setValue(getStateCallback())
      return result
    }
  }

  getPersistentValue(key, defaultValue) {
    if (this._persistentValues[key]) {
      return this._persistentValues[key]
    } else {
      return defaultValue
    }
  }

  savePersistentValue(key, value) {
    this._persistentValues[key] = value
    if (!this.runsInTestMode) {
      fs.writeFileSync(this._persistentStore, JSON.stringify(this._persistentValues))
    }
  }

  registerAddressForEventProcessingAtAccessory(address, callback) {
    if (typeof callback !== 'function') {
      console.log(callback)
      this.log.warn('callback is not a function')
    }
    if ((address) && ((typeof address.address === 'function'))) {
      // this will register var changes like normal events
      // the variable will be checked on a trigger event
      if (address.variable()) {
        this._ccu.registerVariableForEventProcessingAtAccessory(address.variable(), callback)
      } else {
        this._ccu.registerAddressForEventProcessingAtAccessory(address.address(), callback)
      }
    } else {
      this.log.error('[Generic] unable to register %s invalid object or null found', address)
    }
  }

  registerAddressWithSettingsKeyForEventProcessingAtAccessory(key, subkey, callback) {
    let adrForKey = this.getDataPointNameFromSettings(key, subkey)
    this.debugLog('Register Datapoint %s for events', adrForKey)
    if (adrForKey) {
      let fullAdr = this.buildAddress(adrForKey)
      this.debugLog('full addr is %s', fullAdr)
      this.registerAddressForEventProcessingAtAccessory(fullAdr, callback)
    } else {
      this.log.warn('[Generic] no Datapoint for event registering found in %s %s', key, subkey)
    }
  }

  buildAddress(dp) {
    this.debugLog('buildAddress %s', dp)

    if ((dp) && (typeof dp === 'string')) {
      // check its a variable
      let vr = this.isVariable(dp)
      if (vr) {
        this.debugLog('seems to be a variable')
        return new HomeMaticAddress(null, null, null, null, dp)
      }

      var pos = dp.indexOf('.')
      if (pos === -1) {
        this.debugLog('seems to be a single datapoint')
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
        this.debugLog('try I.A:C.D Format |I:%s|A:%s|C:%s|D:%s', intf, address, chidx, dpn)
        return new HomeMaticAddress(intf, address, chidx, dpn)
      } else {
        // try format channel.dp
        let rgx = /([0-9]{1,}).([a-zA-Z0-9-_]{1,})/g
        let parts = rgx.exec(dp)
        if ((parts) && (parts.length === 3)) {
          let chidx = parts[1]
          let dpn = parts[2]
          this.debugLog('match C.D Format |I:%s|A:%s|C:%s|D:%s', this._interf, this._serial, chidx, dpn)
          return new HomeMaticAddress(this._interf, this._serial, chidx, dpn)
        }
      }
    } else {
      this.log.error('[Generic] unable create HM Address from undefined Input %s', dp)

      throw new Error('unable to generate unable create HM Address from undefined Input')
    }
  }

  isTrue(value) {
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

  didMatch(v1, v2) {
    if (typeof v1 === typeof v2) {
      return (v1 === v2)
    }

    if (((typeof v1 === 'number') && (typeof v2 === 'string')) || ((typeof v1 === 'string') && (typeof v2 === 'number'))) {
      return parseFloat(v1) === parseFloat(v2)
    }

    if ((typeof v1 === 'boolean') && (typeof v2 === 'string')) {
      if (v1 === true) {
        return (v2.toLocaleLowerCase() === 'true')
      }
      if (v1 === false) {
        return (v2.toLocaleLowerCase() === 'false')
      }
    }

    if ((typeof v2 === 'boolean') && (typeof v1 === 'string')) {
      if (v2 === true) {
        return (v1.toLocaleLowerCase() === 'true')
      }
      if (v2 === false) {
        return (v1.toLocaleLowerCase() === 'false')
      }
    }

    if ((typeof v1 === 'boolean') && (typeof v2 === 'number')) {
      return (((v1 === true) && (v2 === 1)) || ((v1 === false) && (v2 === 0)))
    }

    if ((typeof v2 === 'boolean') && (typeof v1 === 'number')) {
      return (((v2 === true) && (v1 === 1)) || ((v2 === false) && (v1 === 0)))
    }

    return false
  }



  updateCharacteristic(characteristic, newValue, force = false, delay = 0) {
    if ((characteristic) && ((characteristic.value !== newValue) || (force === true))) {
      this.debugLog('updating %s to %s (%s)', characteristic.displayName, newValue, force)
      //prechecking the margins 
      if ((characteristic.props) && (characteristic.props.minValue)) {
        if (newValue < characteristic.props.minValue) {
          newValue = characteristic.props.minValue
        }
        if (newValue > characteristic.props.maxValue) {
          newValue = characteristic.props.maxValue
        }

      }
      if (delay > 0) {
        setTimeout(() => { characteristic.updateValue(newValue) }, delay)
      } else {
        characteristic.updateValue(newValue)
      }
    } else {
      if (characteristic) {
        this.debugLog('skipp update %s cause the value stayed the same %s (force is %s)', characteristic.displayName, newValue, force)
      }
    }
  }

  isVariable(datapointAddress) {
    return (this._ccu.variableWithName(datapointAddress) !== undefined)
  }

  // validate a datapoint address
  isDatapointAddressValid(datapointAddress, acceptNull) {
    this.debugLog('validate datapoint %s we %s accept nul', datapointAddress, acceptNull ? 'do' : 'do not')
    if ((datapointAddress !== undefined) && (datapointAddress.length > 1)) {
      let parts = datapointAddress.split('.')
      if ((parts.length > 1) && (parts[0] === 'V')) {
        // seems to be a variable
        return true
      }
      // check we have 3 parts interface.address.name
      if (parts.length !== 3) {
        this.log.error('[Generic] %s is invalid not 3 parts', datapointAddress)
        return false
      }
      // check the address has a :
      if (parts[1].indexOf(':') === -1) {
        this.log.error('[Generic] %s is invalid %s does not contain a :', datapointAddress, parts[1])
        return false
      }
      return true
    } else {
      // dp is undefined .. check if this is valid
      if (acceptNull === false) {
        this.log.error('[Generic] null is not a valid datapoint')
      }
      return acceptNull
    }
  }

  parseConfigurationJSON(strJSON, defValue) {
    try {
      return JSON.parse(strJSON)
    } catch (e) {
      return defValue
    }
  }

  /** *************  Configuration Stuff */

  static channelTypes() {
    return ['ABSTRACT']
  }

  static configurationItems() {
    return {}
  }

  static validate(configurationItem) {
    return false
  }

  static serviceDescription() {
    return 'You should never see this'
  }

  // Servicelist will sort on that
  static getPriority() {
    return 0
  }

  static filterDevice() {
    return []
  }

  /** ****** serialization */

  _configureInformationService() {
    let informationService = this.getService(Service.AccessoryInformation)

    informationService.setCharacteristic(Characteristic.Name, this._name)
    informationService.setCharacteristic(Characteristic.Manufacturer, this.getManufacturer())
    informationService.setCharacteristic(Characteristic.Model, this._ccuType || 'Generic')
    informationService.setCharacteristic(Characteristic.SerialNumber, os.hostname() + '_' + this._serial)
  }

  _dictionaryPresentation() {
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
    result.instanceID = this.instanceID
    result.serviceClass = this.serviceClass
    result.settings = this.settings
    result.isPublished = this.isPublished
    result.nameInCCU = this.nameInCCU
    return result
  }
}

module.exports = HomeMaticAccessory
