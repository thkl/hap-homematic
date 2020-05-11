// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticRadiatorThermostatAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.offTemp = 4.5
    this.lastSetTemp = 0
    this.currentTemperature = -255
    this.currentHumidity = -255

    let settings = this.getDeviceSettings()
    this.addBootMode = settings.addBootMode || false

    let service = this.addService(new Service.Thermostat(this._name))

    this.curHeatingState = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
        let fValue = parseFloat(value)
        if (fValue === self.offTemp) {
          callback(null, Characteristic.CurrentHeatingCoolingState.OFF)
        } else {
          callback(null, Characteristic.CurrentHeatingCoolingState.HEAT)
        }
      })

    this.tarHeatingState = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
        let fValue = parseFloat(value)
        if (fValue === self.offTemp) {
          callback(null, Characteristic.TargetHeatingCoolingState.OFF)
        } else {
          callback(null, Characteristic.TargetHeatingCoolingState.HEAT)
        }
      })
      .on('set', async (newValue, callback) => {
        switch (newValue) {
          case Characteristic.TargetHeatingCoolingState.OFF:
            await self.setValueForDataPointNameWithSettingsKey('SetTemperature', null, self.offTemp)
            break
          case Characteristic.TargetHeatingCoolingState.HEAT:
            self.log.debug('[HRTCA] last temp is %s', self.lastSetTemp)
            if (self.lastSetTemp > 0) {
              await self.setValueForDataPointNameWithSettingsKey('SetTemperature', null, self.lastSetTemp)
            }
            break
          default:
            break
        }
        callback()
      })
    // remove the cooling
    this.tarHeatingState.setProps({
      format: Characteristic.Formats.UINT8,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY],
      maxValue: 1,
      minValue: 0,
      minStep: 1
    })

    this.curTemperature = service.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
        let fValue = parseFloat(value)
        self.currentTemperature = fValue
        if (callback) callback(null, fValue)
      })

    this.tarTemperature = service.getCharacteristic(Characteristic.TargetTemperature)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
        let fValue = parseFloat(value)
        if (callback) callback(null, fValue)
      })
      .on('set', async (value, callback) => {
        self.log.debug('[HRTCA] set TargetTemperature %s °C', value)
        await self.setValueForDataPointNameWithSettingsKey('SetTemperature', null, value)
        self.lastSetTemp = parseFloat(value)
        callback()
      })

    service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => {
        if (callback) callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })

    if (this.getDataPointNameFromSettings('Humidity', null)) {
      this.curHumidity = service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', async (callback) => {
          let value = await self.getValueForDataPointNameWithSettingsKey('Humidity', null, false)
          let fValue = parseFloat(value)
          self.currentHumidity = fValue
          if (callback) callback(null, fValue)
        })
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Humidity', null, (newValue) => {
        let pValue = parseFloat(newValue)
        self.curHumidity.updateValue(pValue, null)
        self.currentHumidity = pValue
        self.updateHistory()
      })
    }

    this.enableLoggingService('weather')

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('SetTemperature', null, (newValue) => {
      let pValue = parseFloat(newValue)
      self.log.debug('[HRTCA] setTemperature Event is %s °C', newValue)
      // update target and current heating state
      if (pValue === self.offTemp) {
        self.curHeatingState.updateValue(Characteristic.CurrentHeatingCoolingState.OFF, null)
        self.tarHeatingState.updateValue(Characteristic.TargetHeatingCoolingState.OFF, null)
      } else {
        self.curHeatingState.updateValue(Characteristic.CurrentHeatingCoolingState.HEAT, null)
        self.tarHeatingState.updateValue(Characteristic.TargetHeatingCoolingState.HEAT, null)
        self.lastSetTemp = pValue
      }
      self.tarTemperature.updateValue(pValue, null)
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature', null, (newValue) => {
      let pValue = parseFloat(newValue)
      self.currentTemperature = pValue
      self.curTemperature.updateValue(pValue, null)
      self.updateHistory()
    })

    this.addLowBatCharacteristic(service)
    this.boostState = 0

    if (this.addBootMode) {
    // add the Boost Mode Switch
      let boostService = this.addService(new Service.Switch(this._name + 'Boost Mode', 'Boost Mode'))
      this.boostMode = boostService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
          if (callback) callback(null, (self.boostState > 0))
        })
        .on('set', (value, callback) => {
          self.log.debug('[HRTCA] hk boost command %s', value)
          if (value === true) {
            self.setValue('BOOST_MODE', true, () => {})
          } else {
            if (self.controlMode === 0) {
              self.log.debug('[HRTCA] boost is off restoring controlmode auto')
              self.setValue('AUTO_MODE', 1, () => {})
            } else {
              self.log.debug('[HRTCA] boost is off restoring controlmode manu')
              self.setValue('MANU_MODE', 1, () => {})
            }
          }
          callback()
        })

        //
    }

    if (this.boostMode) {
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('BOOST_MODE'), (newValue) => {
        self.boostState = self.isTrue(newValue)
        self.log.debug('[HRTCA] BOOST_MODE is %s (%s)', self.boostState, (self.boostState > 0))
        self.boostMode.updateValue((self.boostState > 0), null)

        self.addLogEntry({status: (self.boostState > 0) ? 1 : 0})
        if (self.boostState > 0) {
          self.updateLastActivation()
        }
      })
    }
  }

  updateHistory () {
    if ((this.currentTemperature !== -255) && (this.currentHumidity !== -255)) {
      this.addLogEntry({temp: this.currentTemperature, pressure: 0, humidity: this.currentHumidity})
    }
  }

  static channelTypes () {
    return ['HEATING_CLIMATECONTROL_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a thermostat for HomeKit'
  }

  initServiceSettings () {
    return {
      'HEATING_CLIMATECONTROL_TRANSCEIVER': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'},
        SetTemperature: {name: 'SET_POINT_TEMPERATURE'}
      }
    }
  }

  static configurationItems () {
    return {
      'addBootMode': {
        type: 'checkbox',
        default: false,
        label: 'Add a boost mode switch',
        hint: 'adds a switch to turn the boost mode on'
      }
    }
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticRadiatorThermostatAccessory
