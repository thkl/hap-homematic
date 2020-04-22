// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticRadiatorThermostatAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.offTemp = 4.5
    this.lastSetTemp = 0
    let settings = this.getDeviceSettings()
    this.addBootMode = settings.addBootMode || false

    let service = this.addService(new Service.Thermostat(this._name))

    this.curHeatingState = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', (callback) => {
        self.getValue('SET_POINT_TEMPERATURE', true).then((value) => {
          let fValue = parseFloat(value)
          if (fValue === self.offTemp) {
            callback(null, Characteristic.CurrentHeatingCoolingState.OFF)
          } else {
            callback(null, Characteristic.CurrentHeatingCoolingState.HEAT)
          }
        })
      })

    this.tarHeatingState = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', (callback) => {
        self.getValue('SET_POINT_TEMPERATURE', true).then((value) => {
          let fValue = parseFloat(value)
          if (fValue === self.offTemp) {
            callback(null, Characteristic.TargetHeatingCoolingState.OFF)
          } else {
            callback(null, Characteristic.TargetHeatingCoolingState.HEAT)
          }
        })
      })
      .on('set', (newValue, callback) => {
        switch (newValue) {
          case Characteristic.TargetHeatingCoolingState.OFF:
            self.setValue('SET_POINT_TEMPERATURE', self.offTemp).then((value) => {})
            break
          case Characteristic.TargetHeatingCoolingState.HEAT:
            if (self.lastSetTemp > 0) {
              self.setValue('SET_POINT_TEMPERATURE', self.lastSetTemp).then((value) => {})
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
      .on('get', (callback) => {
        self.getValue('ACTUAL_TEMPERATURE', true).then((value) => {
          let fValue = parseFloat(value)
          if (callback) callback(null, fValue)
        })
      })

    this.tarTemperature = service.getCharacteristic(Characteristic.TargetTemperature)
      .on('get', (callback) => {
        self.getValue('SET_POINT_TEMPERATURE', true).then((value) => {
          let fValue = parseFloat(value)
          if (callback) callback(null, fValue)
        })
      })
      .on('set', (value, callback) => {
        self.setValue('SET_POINT_TEMPERATURE', value).then((value) => {
          callback()
        })
      })

    service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => {
        if (callback) callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })

    this.enableLoggingService('weather')

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('SET_POINT_TEMPERATURE'), (newValue) => {
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

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('ACTUAL_TEMPERATURE'), (newValue) => {
      let pValue = parseFloat(newValue)
      self.curTemperature.updateValue(pValue, null)
      self.updateHistory(pValue)
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

  updateHistory (temp) {
    this.addLogEntry({temp: this.currentTemperature, pressure: 0, humidity: 0})
  }

  static channelTypes () {
    return ['HEATING_CLIMATECONTROL_TRANSCEIVER']
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
