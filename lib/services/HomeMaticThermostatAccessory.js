// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticThermostatAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.offTemp = 4.5
    this.lastSetTemp = 0

    let service = this.addService(new Service.Thermostat(this._name))

    this.curHeatingState = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', (callback) => {
        self.getValue('SET_TEMPERATURE', true).then((value) => {
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
        self.getValue('SET_TEMPERATURE', true).then((value) => {
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
            self.setValue('SET_TEMPERATURE', self.offTemp).then((value) => {})
            break
          case Characteristic.TargetHeatingCoolingState.HEAT:
            if (self.lastSetTemp > 0) {
              self.setValue('SET_TEMPERATURE', self.lastSetTemp).then((value) => {})
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
        self.getValue('SET_TEMPERATURE', true).then((value) => {
          let fValue = parseFloat(value)
          if (callback) callback(null, fValue)
        })
      })
      .on('set', (value, callback) => {
        self.setValue('SET_TEMPERATURE', value).then((value) => {
          callback()
        })
      })

    service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', function (callback) {
        if (callback) callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })

    this.enableLoggingService('weather')

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('SET_TEMPERATURE'), function (newValue) {
      let pValue = parseFloat(newValue)
      self.log.debug('[HTCA] setTemperature Event is %s °C', newValue)
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

    if (this._ccuType === 'THERMALCONTROL_TRANSMIT') {
      this.curHumidity = service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', (callback) => {
          self.getValue('ACTUAL_HUMIDITY', true).then((value) => {
            let fValue = parseFloat(value)
            if (callback) callback(null, fValue)
          })
        })
    }

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('ACTUAL_TEMPERATURE'), function (newValue) {
      let pValue = parseFloat(newValue)
      self.curTemperature.updateValue(pValue, null)
      self.updateHistory(pValue, 0)
    })

    if (this.curHumidity) {
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('ACTUAL_HUMIDITY'), function (newValue) {
        let pValue = parseFloat(newValue)
        self.curHumidity.updateValue(pValue, null)
        self.updateHistory(0, pValue)
      })
    }

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('CONTROL_MODE'), function (newValue) {
      if (parseInt(newValue) !== 3) {
        self.controlMode = parseInt(newValue)
        self.log.debug('[HTCA] controlMode is %s', newValue)
      } else {
        self.log.debug('[HTCA] ignore Boost Mode as controlMode 3')
      }
    })

    this.addLowBatCharacteristic(service)
    this.boostState = 0
    // add the Boost Mode Switch
    let boostService = this.addService(new Service.Switch(this._name + 'Boost Mode', 'Boost Mode'))
    this.boostMode = boostService.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        if (callback) callback(null, (self.boostState > 0))
      })
      .on('set', (value, callback) => {
        self.log.debug('[HTCA] hk boost command %s', value)
        if (value === true) {
          self.setValue('BOOST_MODE', 1, () => {})
        } else {
          if (self.controlMode === 0) {
            self.log.debug('[HTCA] boost is off restoring controlmode auto')
            self.setValue('AUTO_MODE', 1, () => {})
          } else {
            self.log.debug('[HTCA] boost is off restoring controlmode manu')
            self.setValue('MANU_MODE', 1, () => {})
          }
        }
        callback()
      })

    if (this.boostMode) {
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('BOOST_STATE'), function (newValue) {
        self.boostState = parseInt(newValue)
        self.log.debug('[HTCA] BOOST STATE is %s (%s)', self.boostState, (self.boostState > 0))
        self.boostMode.updateValue((self.boostState > 0), null)
      })
    }
  }

  updateHistory (temp, hum) {
    if (temp !== 0) {
      this.currentTemperature = temp
    }
    if (hum !== 0) {
      this.currentHumidity = hum
    }
    this.addLogEntry({temp: this.currentTemperature, pressure: 0, humidity: this.currentHumidity})
  }

  static channelTypes () {
    return ['CLIMATECONTROL_RT_TRANSCEIVER', 'THERMALCONTROL_TRANSMIT']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticThermostatAccessory
