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

    this.currentTemperature = -255
    this.currentHumidity = -255
    this.targetTemperature = -255

    let settings = this.getDeviceSettings()
    this.addBoostMode = settings.addBootMode || false

    this.service = this.addService(new Service.Thermostat(this._name))

    this.curHeatingState = this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', async (callback) => {
        self.log.debug('[HTCA] getCurrentHeatingCoolingState')
        let modes = await self.calculateHeatingCoolingState(Characteristic)
        self.log.debug('[HTCA] getCurrentHeatingCoolingState %s', modes.currentMode)
        callback(null, modes.currentMode)
      })

    this.tarHeatingState = this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', async (callback) => {
        let modes = await self.calculateHeatingCoolingState(Characteristic)
        self.log.debug('[HTCA] getTargetHeatingCoolingState %s', modes.targetMode)
        callback(null, modes.targetMode)
      })
      .on('set', async (newValue, callback) => {
        switch (newValue) {
          case Characteristic.TargetHeatingCoolingState.OFF:
            // set ControlMode to manu
            await self.setValue('MANU_MODE', true)
            await self.setValue('SET_TEMPERATURE', self.offTemp)
            break
          case Characteristic.TargetHeatingCoolingState.HEAT:
            await self.setValue('MANU_MODE', self.currentTargetTemperature)
            await self.setValue('SET_TEMPERATURE', self.currentTargetTemperature)
            break
          case Characteristic.TargetHeatingCoolingState.AUTO:
            await self.setValue('AUTO_MODE', true)
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
      validValues: [0, 1, 3]
    })

    this.curTemperatureChar = this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', (callback) => {
        self.getValue('ACTUAL_TEMPERATURE', true).then((value) => {
          let fValue = parseFloat(value)
          self.currentTemperature = fValue
          if (callback) callback(null, fValue)
        })
      })

    this.tarTemperatureChar = this.service.getCharacteristic(Characteristic.TargetTemperature)
      .on('get', async (callback) => {
        if (self.targetTemperature === -255) {
          let fValue = await self.getValue('SET_TEMPERATURE', true)
          self.targetTemperature = fValue
        }
        if (callback) callback(null, self.targetTemperature)
      })
      .on('set', (value, callback) => {
        self.targetTemperature = value
        self.log.debug('[HTCA] set TargetTemperature to %s °C', self.targetTemperature)
        self.setValue('SET_TEMPERATURE', value).then(() => {
          callback()
        })
      })

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => {
        if (callback) callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })

    this.enableLoggingService('weather')

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('SET_TEMPERATURE'), async (newValue) => {
      self.targetTemperature = parseFloat(newValue)
      self.log.debug('[HTCA] setTemperature Event is %s °C', newValue)
      let modes = await self.calculateHeatingCoolingState(Characteristic)
      self.curHeatingState.updateValue(modes.currentMode, null)
      self.tarHeatingState.updateValue(modes.targetMode, null)
      self.tarTemperatureChar.updateValue(self.targetTemperature, null)
    })

    if (this.getDataPointNameFromSettings('Humidity', null)) {
      this.curHumidity = this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
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
      self.currentTemperature = parseFloat(newValue)
      self.log.debug('[HTCA] curTemperature Event is %s °C', self.currentTemperature)
      self.curTemperatureChar.updateValue(self.currentTemperature, null)
      self.updateHistory()
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('CONTROL_MODE'), async (newValue) => {
      self.log.debug('[HTCA] event ControlMode is %s', newValue)
      self.controlMode = parseInt(newValue)
      let modes = await self.calculateHeatingCoolingState(Characteristic)
      self.curHeatingState.updateValue(modes.currentMode, null)
      self.tarHeatingState.updateValue(modes.targetMode, null)
    })

    this.boostState = 0

    if (this.addBoostMode) {
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
      })
    }

    this.addLowBatCharacteristic()
  }

  async calculateHeatingCoolingState (Characteristic) {
    // We have to calculate the  state depending on the controlmode
    let result = {}
    // if not set update the values - further updates will come thru events
    if (this.targetTemperature === -255) {
      let value = await this.getValue('SET_TEMPERATURE', true)
      if (value) {
        this.targetTemperature = parseFloat(value)
      }
    }

    if (this.currentTemperature === -255) {
      let value = await this.getValue('ACTUAL_TEMPERATURE', true)
      if (value) {
        this.currentTemperature = parseFloat(value)
      }
    }

    if (this.controlMode === undefined) {
      this.log.debug('[HTCA] setTemp != offTemp getControlMode')
      this.controlMode = await this.getValue('CONTROL_MODE')
    }

    this.log.debug('[HTCA] getting Mode from these Values : CT: %s  TT: %s CM: %s', this.currentTemperature, this.targetTemperature, this.controlMode)

    if ((this.currentTemperature > this.targetTemperature) || (this.targetTemperature === this.offTemp)) {
      this.log.debug('[HTCA] currentMode = OFF')
      result.currentMode = Characteristic.CurrentHeatingCoolingState.OFF
    } else {
      this.log.debug('[HTCA] currentMode = HEAT')
      result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
    }

    switch (this.controlMode) {
      case 0:
        this.log.debug('[HTCA] targetMode = AUTO')
        result.targetMode = Characteristic.TargetHeatingCoolingState.AUTO
        break
      case 1:
      case 2:
        this.log.debug('[HTCA] targetMode = HEAT')
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        break
      case 3:
        this.log.debug('[HTCA] targetMode = HEAT')
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        // when Boost the mode is heating
        this.log.debug('[HTCA] currentMode = HEAT')
        result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
    }

    if (this.targetTemperature === this.offTemp) {
      this.log.debug('[HTCA] targetMode = OFF')
      result.targetMode = Characteristic.TargetHeatingCoolingState.OFF
    }
    return result
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
