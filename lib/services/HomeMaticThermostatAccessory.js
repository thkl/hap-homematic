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
  async publishServices (Service, Characteristic) {
    let self = this
    this.offTemp = 4.5

    this.currentTemperature = -255
    this.currentHumidity = -255
    this.targetTemperature = -255
    this.lastTemperature = -255
    let settings = this.getDeviceSettings()
    this.addBoostMode = settings.addBootMode || false

    this.service = this.addService(new Service.Thermostat(this._name))

    this.curHeatingState = this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', async (callback) => {
        let modes = await self.calculateHeatingCoolingState(Characteristic)
        self.log.debug('[HTCA] %s getCurrentHeatingCoolingState %s', self._serial, modes.currentMode)
        callback(null, modes.currentMode)
      })
      .setProps({
        format: Characteristic.Formats.UINT8,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        validValues: [0, 1, 3]
      })

    this.tarHeatingState = this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        format: Characteristic.Formats.UINT8,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY],
        validValues: [0, 1, 3]
      })
      .on('get', async (callback) => {
        let modes = await self.calculateHeatingCoolingState(Characteristic)
        self.log.debug('[HTCA] %s getTargetHeatingCoolingState %s', self._serial, modes.targetMode)
        callback(null, modes.targetMode)
      })
      .on('set', async (newValue, callback) => {
        self.log.debug('[HTCA] %s setTargetHeatingCoolingState %s', self._serial, newValue)
        self.setControlMode(newValue)
        callback()
      })

    this.curTemperatureChar = this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
        let fValue = parseFloat(value)
        self.currentTemperature = fValue
        if (callback) callback(null, fValue)
      })

    this.tarTemperatureChar = this.service.getCharacteristic(Characteristic.TargetTemperature)
      .on('get', async (callback) => {
        if (self.targetTemperature === -255) {
          let fValue = await self.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
          self.targetTemperature = fValue
        }
        if (callback) callback(null, self.targetTemperature)
      })
      .on('set', async (value, callback) => {
        self.targetTemperature = value
        if (self.targetTemperature !== self.offTemp) {
          self.lastTemperature = self.targetTemperature
        }
        self.log.debug('[HTCA] %s set TargetTemperature to %s °C', self._serial, self.targetTemperature)
        await self.setValueForDataPointNameWithSettingsKey('SetTemperature', null, value)
        callback()
      })
      .setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.CELSIUS,
        maxValue: 38,
        minValue: self.offTemp,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      })

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => {
        if (callback) callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })

    this.enableLoggingService('weather')

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('SetTemperature', null, (newValue) => {
      self.processSetTempEvent(Characteristic, newValue)
    })

    let hmDp = this.getDataPointNameFromSettings('Humidity', null)
    self.log.debug('[HTCA] %s check if datapoint for Humidity exists : %s', self._serial, hmDp)
    if ((hmDp) && (await this._ccu.hazDatapoint(this.buildAddress(hmDp)))) {
      self.log.debug('[HTCA] %s add humidity', self._serial)
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

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature', null, (newValue) => {
      self.currentTemperature = parseFloat(newValue)
      self.log.debug('[HTCA] %s curTemperature Event is %s °C', self._serial, self.currentTemperature)
      self.curTemperatureChar.updateValue(self.currentTemperature, null)
      self.updateHistory()
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('ControlMode', null, (newValue) => {
      self.processSetControlEvent(Characteristic, newValue)
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
        self.boostMode.updateValue((self.boostState > 0))
      })
    }

    // check if there is a VALVE_STATE datapoint and add the valve
    if (await this._ccu.hazDatapoint(this.buildAddress('VALVE_STATE'))) {
      const EveHomeKitValveTypes = require(path.join(__dirname, 'EveValve.js'))
      let eveThermoProg = new EveHomeKitValveTypes(this.gatoHomeBridge.hap)
      this.service.addOptionalCharacteristic(eveThermoProg.Characteristic.CurrentValveState)
      let chValve = this.service.getCharacteristic(eveThermoProg.Characteristic.CurrentValveState)
      chValve.on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('ValveState', null, false)
        let fValue = parseFloat(value)
        callback(null, (fValue * 100))
      })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('ValveState', null, (newValue) => {
        let fValue = parseFloat(newValue)
        self.updateCharacteristic(chValve, (fValue * 100))
      })
    }

    this.addLowBatCharacteristic()
  }

  async processSetTempEvent (Characteristic, newValue) {
    this.targetTemperature = parseFloat(newValue)
    this.log.debug('[HTCA] %s setTemperature Event is %s °C', this._serial, newValue)

    if (!this.lockModes) {
      let modes = await this.calculateHeatingCoolingState(Characteristic)
      this.log.debug('[HTCA] %s setModes is %s', this._serial, modes)
      this.updateCharacteristic(this.curHeatingState, modes.currentMode)
      this.updateCharacteristic(this.tarHeatingState, modes.targetMode)
    }

    this.log.debug('[HTCA] %s targetTemperature is %s', this._serial, this.targetTemperature)
    this.updateCharacteristic(this.tarTemperatureChar, this.targetTemperature)
  }

  async processSetControlEvent (Characteristic, newValue) {
    if (this.lockModes) {
      this.log.debug('[HTCA] %s event ControlMode ModeChange is locked due to manual set', this._serial)
      return
    }
    this.log.debug('[HTCA] %s event ControlMode is %s', this._serial, newValue)
    this.controlMode = parseInt(newValue)
    let modes = await this.calculateHeatingCoolingState(Characteristic)
    this.updateCharacteristic(this.curHeatingState, modes.currentMode)
    this.updateCharacteristic(this.tarHeatingState, modes.targetMode)
  }

  async calculateHeatingCoolingState (Characteristic) {
    // We have to calculate the  state depending on the controlmode
    let result = {}
    // if not set update the values - further updates will come thru events
    if (this.targetTemperature === -255) {
      this.log.debug('[HTCA] %s unknown target temp request it...', this._serial)
      let value = await this.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
      if (value) {
        this.log.debug('[HTCA] %s result for target temperature is %s', this._serial, value)
        this.targetTemperature = parseFloat(value)
      }
    }

    if (this.currentTemperature === -255) {
      this.log.debug('[HTCA] %s unknown current temp request it...', this._serial)
      let value = await this.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
      if (value) {
        this.log.debug('[HTCA] %s result for current temperature is %s', this._serial, value)
        this.currentTemperature = parseFloat(value)
      }
    }

    if (this.controlMode === undefined) {
      this.log.debug('[HTCA] %s setTemp != offTemp getControlMode', this._serial)
      await this.getControlMode()
    }

    this.log.debug('[HTCA] %s getting Mode from these Values : CT: %s  TT: %s CM: %s',
      this._serial, this.currentTemperature, this.targetTemperature, this.controlMode)

    if (this.currentTemperature > this.targetTemperature) {
      this.log.debug('[HTCA] %s currentMode = OFF', this._serial)
      result.currentMode = Characteristic.CurrentHeatingCoolingState.OFF
    } else {
      this.log.debug('[HTCA] %s currentMode = HEAT', this._serial)
      result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
    }

    switch (this.controlMode) {
      case 0:
        this.log.debug('[HTCA] %s targetMode = AUTO', this._serial)
        result.targetMode = Characteristic.TargetHeatingCoolingState.AUTO
        break
      case 1:
      case 2:
        this.log.debug('[HTCA] %s targetMode = HEAT', this._serial)
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        break
      case 3:
        this.log.debug('[HTCA] %s targetMode = HEAT', this._serial)
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        // when Boost the mode is heating
        this.log.debug('[HTCA] %s currentMode = HEAT', this._serial)
        result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
    }

    if (this.targetTemperature === this.offTemp) {
      this.log.debug('[HTCA] %s targetMode = OFF (tagetTemp == offTemp)', this._serial)
      result.targetMode = Characteristic.TargetHeatingCoolingState.OFF
    }

    return result
  }

  getControlMode () {
    let self = this
    return new Promise((resolve, reject) => {
      if (self.controlMode === undefined) {
        self.getValueForDataPointNameWithSettingsKey('ControlMode', null, true).then((newValue) => {
          self.controlMode = parseInt(newValue)
          resolve(self.controlMode)
        })
      } else {
        resolve(self.controlMode)
      }
    })
  }

  setControlMode (newMode) {
    let self = this
    this.log.debug('[HTCA] %s setControlMode %s', this._serial, newMode)
    switch (newMode) {
      case 0: // OFF
        // set ControlMode to manu
        this.lockModes = true
        this.log.debug('[HTCA] %s setControlMode OFF - Manu Mode targetTemp is %s', this._serial, this.offTemp)
        this.setValueForDataPointNameWithSettingsKey('SetManuMode', null, this.getDataPointValueFromSettings('SetManuMode'))
        this.setValueForDataPointNameWithSettingsKey('SetTemperature', null, this.offTemp).then(() => {
          self.lockModes = false
          self.log.debug('[HTCA] %s setControlMode unlock events', self._serial)
        })
        break
      case 1: // HEAT
        this.log.debug('[HTCA] %s setControlMode HEAT - Manu Mode lastTemperature is %s', this._serial, this.lastTemperature)
        this.setValueForDataPointNameWithSettingsKey('SetManuMode', null, this.getDataPointValueFromSettings('SetManuMode'))
        if ((this.lastTemperature === -255) || (this.lastTemperature === this.offTemp)) {
          this.lastTemperature = 20
        }
        this.targetTemperature = this.lastTemperature
        this.lockModes = true
        this.setValueForDataPointNameWithSettingsKey('SetTemperature', null, this.lastTemperature).then(() => {
          self.lockModes = false
          self.log.debug('[HTCA] %s setControlMode unlock events', self._serial)
        })
        break
      case 3: // AUTO
        this.lockModes = true
        this.log.debug('[HTCA] %s setControlMode AUTO - Auto Mode', this._serial)
        this.setValueForDataPointNameWithSettingsKey('SetAutoMode', null, this.getDataPointValueFromSettings('SetAutoMode')).then(() => {
          self.lockModes = false
          self.log.debug('[HTCA] %s setControlMode unlock events', self._serial)
        })
        break

      default:
        break
    }
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
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        SetTemperature: {name: 'SET_TEMPERATURE'},
        ControlMode: {name: 'CONTROL_MODE'},
        SetManuMode: {name: 'MANU_MODE', value: 1},
        SetAutoMode: {name: 'AUTO_MODE', value: 1},
        Humidity: {name: 'ACTUAL_HUMIDITY'},
        ValveState: {name: 'VALVE_STATE'}
      },
      'THERMALCONTROL_TRANSMIT': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        SetTemperature: {name: 'SET_TEMPERATURE'},
        Humidity: {name: 'ACTUAL_HUMIDITY'},
        ControlMode: {name: 'CONTROL_MODE'},
        SetManuMode: {name: 'MANU_MODE', value: 1},
        SetAutoMode: {name: 'AUTO_MODE', value: 1}
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
