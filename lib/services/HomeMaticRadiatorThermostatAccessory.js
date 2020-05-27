/*
 * File: HomeMaticRadiatorThermostatAccessory.js
 * Project: hap-homematic
 * File Created: Wednesday, 22nd April 2020 7:03:44 pm
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

class HomeMaticRadiatorThermostatAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.offTemp = 4.5
    this.lastSetTemp = 0
    this.currentTemperature = -255
    this.currentHumidity = -255
    this.targetTemperature = -255

    let settings = this.getDeviceSettings()
    this.addBootMode = settings.addBootMode || false

    let service = this.addService(new Service.Thermostat(this._name))

    this.curHeatingState = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', async (callback) => {
        let modes = await self.calculateHeatingCoolingState(Characteristic)
        callback(null, modes.currentMode)
      })

    this.tarHeatingState = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', async (callback) => {
        let modes = await self.calculateHeatingCoolingState(Characteristic)
        callback(null, modes.targetMode)
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
      validValues: [0, 1, 3]
    })

    this.curTemperatureChar = service.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
        self.currentTemperature = parseFloat(value)
        self.log.debug('[HRTCA] get Current temp is %s', self.currentTemperature)
        if (callback) callback(null, self.currentTemperature)
      })

    this.tarTemperatureChar = service.getCharacteristic(Characteristic.TargetTemperature)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
        self.targetTemperature = parseFloat(value)
        if (callback) callback(null, self.targetTemperature)
      })
      .on('set', async (value, callback) => {
        self.targetTemperature = parseFloat(value)
        await self.setValueForDataPointNameWithSettingsKey('SetTemperature', null, value)
        self.lastSetTemp = parseFloat(value)
        self.log.debug('[HRTCA] set TargetTemperature %s °C', self.targetTemperature)
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
          self.currentHumidity = parseFloat(value)
          if (callback) callback(null, self.currentHumidity)
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Humidity', null, (newValue) => {
        self.currentHumidity = parseFloat(newValue)
        self.curHumidity.updateValue(self.currentHumidity, null)
        self.updateHistory()
      })
    }

    this.enableLoggingService('weather')

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('SetTemperature', null, async (newValue) => {
      self.targetTemperature = parseFloat(newValue)
      let modes = await self.calculateHeatingCoolingState(Characteristic)
      self.curHeatingState.updateValue(modes.currentMode, null)
      self.tarHeatingState.updateValue(modes.targetMode, null)
      self.tarTemperatureChar.updateValue(self.targetTemperature, null)
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature', null, (newValue) => {
      self.currentTemperature = parseFloat(newValue)
      self.log.debug('[HRTCA]  Current temp event is %s', self.currentTemperature)
      self.curTemperatureChar.updateValue(self.currentTemperature, null)
      self.updateHistory()
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('ControlMode', null, async (newValue) => {
      self.controlMode = parseFloat(newValue)
      let modes = await self.calculateHeatingCoolingState(Characteristic)
      self.curHeatingState.updateValue(modes.currentMode, null)
      self.tarHeatingState.updateValue(modes.targetMode, null)
    })

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

    this.addLowBatCharacteristic()
  }

  async calculateHeatingCoolingState (Characteristic) {
    // We have to calculate the  state depending on the controlmode
    let result = {}
    // if not set update the values - further updates will come thru events
    if (this.targetTemperature === -255) {
      let value = await this.getValueForDataPointNameWithSettingsKey('SetTemperature', null, true)
      if (value) {
        this.targetTemperature = parseFloat(value)
      }
    }

    if (this.currentTemperature === -255) {
      let value = await this.getValueForDataPointNameWithSettingsKey('Temperature', null, true)
      if (value) {
        this.currentTemperature = parseFloat(value)
      }
    }

    if (this.controlMode === undefined) {
      this.log.debug('[HRTCA] setTemp != offTemp getControlMode')
      this.controlMode = await this.getValueForDataPointNameWithSettingsKey('ControlMode', null, true)
    }

    this.log.debug('[HRTCA] getting Mode from these Values : CT: %s  TT: %s CM: %s', this.currentTemperature, this.targetTemperature, this.controlMode)

    if ((this.currentTemperature > this.targetTemperature) || (this.targetTemperature === this.offTemp)) {
      this.log.debug('[HRTCA] currentMode = OFF')
      result.currentMode = Characteristic.CurrentHeatingCoolingState.OFF
    } else {
      this.log.debug('[HRTCA] currentMode = HEAT')
      result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
    }

    switch (this.controlMode) {
      case 0:
        this.log.debug('[HRTCA] targetMode = AUTO')
        result.targetMode = Characteristic.TargetHeatingCoolingState.AUTO
        break
      case 1:
      case 2:
        this.log.debug('[HRTCA] targetMode = HEAT')
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        break
      case 3:
        this.log.debug('[HRTCA] targetMode = HEAT')
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        // when Boost the mode is heating
        this.log.debug('[HRTCA] currentMode = HEAT')
        result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
    }

    if (this.targetTemperature === this.offTemp) {
      this.log.debug('[HRTCA] targetMode = OFF')
      result.targetMode = Characteristic.TargetHeatingCoolingState.OFF
    }
    return result
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
        voltage: 2.4,
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'},
        SetTemperature: {name: 'SET_POINT_TEMPERATURE'},
        ControlMode: {name: 'SET_POINT_MODE'}
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
