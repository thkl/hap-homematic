/*
 * File: HomeMaticThermostatAccessory.js
 * Project: hap-homematic
 * File Created: Wednesday, 25th March 2020 10:01:00 am
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
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticThermostatAccessory extends HomeMaticAccessory {
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
        let value = await self.getValue('SET_TEMPERATURE', true)
        let fValue = parseFloat(value)
        if (fValue === self.offTemp) {
          callback(null, Characteristic.CurrentHeatingCoolingState.OFF)
        } else {
          callback(null, Characteristic.CurrentHeatingCoolingState.HEAT)
        }
      })

    this.tarHeatingState = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', async (callback) => {
        let value = await self.getValue('SET_TEMPERATURE', true)
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
            // remember the last control mode
            self.offControlMode = await self.getValue('CONTROL_MODE')
            // set ControlMode to manu
            await self.setValue('CONTROL_MODE', 1)
            await self.setValue('SET_TEMPERATURE', self.offTemp)
            break
          case Characteristic.TargetHeatingCoolingState.HEAT:
            if (self.lastSetTemp > 0) {
              // reset the control mode
              if (self.offControlMode) {
                await self.setValue('CONTROL_MODE', self.offControlMode)
              }
              await self.setValue('SET_TEMPERATURE', self.lastSetTemp)
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
          self.currentTemperature = fValue
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
      .on('get', (callback) => {
        if (callback) callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })

    this.enableLoggingService('weather')

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('SET_TEMPERATURE'), (newValue) => {
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
        self.currentHumidity = pValue
        self.curHumidity.updateValue(pValue, null)
        self.updateHistory()
      })
    } else {
      self.currentHumidity = 0
    }

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('ACTUAL_TEMPERATURE'), (newValue) => {
      let pValue = parseFloat(newValue)
      self.currentTemperature = pValue
      self.curTemperature.updateValue(pValue, null)
      self.updateHistory()
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('CONTROL_MODE'), (newValue) => {
      if (parseInt(newValue) !== 3) {
        self.controlMode = parseInt(newValue)
        self.log.debug('[HTCA] controlMode is %s', newValue)
      } else {
        self.log.debug('[HTCA] ignore Boost Mode as controlMode 3')
      }
    })

    this.boostState = 0

    if (this.addBootMode) {
    // add the Boost Mode Switch
      let boostService = this.addService(new Service.Switch(this._name + ' Boost Mode', 'Boost Mode'))
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

        //
    }

    if (this.boostMode) {
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('BOOST_STATE'), (newValue) => {
        self.boostState = parseInt(newValue)
        self.log.debug('[HTCA] BOOST STATE is %s (%s)', self.boostState, (self.boostState > 0))
        self.boostMode.updateValue((self.boostState > 0), null)

        self.addLogEntry({status: (self.boostState > 0) ? 1 : 0})
        if (self.boostState > 0) {
          self.updateLastActivation()
        }
      })
    }

    this.addLowBatCharacteristic()
  }

  updateHistory () {
    // do not add the first 0 after reboot
    if ((this.currentTemperature !== -255) && (this.currentHumidity !== -255)) {
      this.addLogEntry({temp: this.currentTemperature, pressure: 0, humidity: this.currentHumidity})
    }
  }

  static channelTypes () {
    return ['CLIMATECONTROL_RT_TRANSCEIVER', 'THERMALCONTROL_TRANSMIT']
  }

  static serviceDescription () {
    return 'This service provides a thermostat for HomeKit'
  }

  initServiceSettings () {
    return {
      '*': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'}
      },
      'THERMALCONTROL_TRANSMIT': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'ACTUAL_HUMIDITY'}
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

module.exports = HomeMaticThermostatAccessory
