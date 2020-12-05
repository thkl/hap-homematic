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
    this.minSetTemp = 4.5
    this.maxSetTemp = 30.5
    this.offTemp = 4.5
    this.currentTemperature = -255
    this.currentHumidity = -255
    this.targetTemperature = -255
    this.lastTemperature = -255
    let settings = this.getDeviceSettings()
    this.addBoostMode = settings.addBootMode || false
    // only fetch min max if we know where to get this
    if (this.getDataPointNameFromSettings('minTemp', null)) {
      this.getMinMaxTemp()
    }

    this.service = this.addService(new Service.Thermostat(this._name))

    if (this.getDataPointNameFromSettings('ControlMode', null)) {
      this.debugLog('Registering Controle Mode Characteristic')
      this.curHeatingState = this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .on('get', async (callback) => {
          let modes = await self.calculateHeatingCoolingState(Characteristic)
          self.lastMode = modes.currentMode
          self.debugLog('getCurrentHeatingCoolingState %s', modes.currentMode)
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
          self.debugLog('getTargetHeatingCoolingState %s', modes.targetMode)
          callback(null, modes.targetMode)
        })
        .on('set', async (newValue, callback) => {
          self.debugLog('setTargetHeatingCoolingState (ControlMode) %s', newValue)
          self.setControlMode(newValue)

          let modes = await self.calculateHeatingCoolingState(Characteristic)
          self.updateCharacteristic(self.curHeatingState, modes.currentMode)
          callback()
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('ControlMode', null, (newValue) => {
        self.processSetControlEvent(Characteristic, newValue)
      })
    }

    this.curTemperatureChar = this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
        let fValue = parseFloat(value)
        self.debugLog('Current Temperature is %s', fValue)
        self.currentTemperature = fValue
        if (callback) callback(null, fValue)
      })

    this.tarTemperatureChar = this.service.getCharacteristic(Characteristic.TargetTemperature)
      .on('get', async (callback) => {
        if (self.targetTemperature === -255) {
          let fValue = await self.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
          self.targetTemperature = fValue
        }
        self.debugLog('Target Temperature is %s', self.targetTemperature)
        if (callback) callback(null, self.targetTemperature)
      })
      .on('set', async (value, callback) => {
        self.debugLog('set TargetTemperature Event from HomeKit with vaue %s °C', value)
        self.targetTemperature = value

        if (self.targetTemperature !== self.offTemp) {
          self.debugLog('its != offTemp so save in lastTemperature')
          self.lastTemperature = self.targetTemperature
        }
        self.debugLog('(set TargetTemperature event from HomeKit) Will set Target Temp in CCU to %s', this.lastTemperature)
        await self.setValueForDataPointNameWithSettingsKey('SetTemperature', null, value)
        callback()
      })
      .setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.CELSIUS,
        maxValue: self.maxSetTemp,
        minValue: self.minSetTemp,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      })

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => {
        if (callback) callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS)
      })

    this.enableLoggingService('weather')

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('SetTemperature', null, (newValue) => {
      self.debugLog('SetTemp Event %s', newValue)
      if (!self.lockModes) {
        self.processSetTempEvent(Characteristic, newValue)
      }
    })

    let hmDp = this.getDataPointNameFromSettings('Humidity', null)
    self.debugLog('check if datapoint for Humidity exists : %s', hmDp)
    if ((hmDp) && (await this._ccu.hazDatapoint(this.buildAddress(hmDp)))) {
      self.debugLog('add humidity')
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
      self.debugLog('curTemperature Event is %s °C', self.currentTemperature)
      self.curTemperatureChar.updateValue(self.currentTemperature, null)
      self.updateHistory()
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
          self.debugLog('hk boost command %s', value)
          if (value === true) {
            self.setValue('BOOST_MODE', 1, () => {})
          } else {
            if (self.controlMode === 0) {
              self.debugLog('boost is off restoring controlmode auto')
              self.setValue('AUTO_MODE', 1, () => {})
            } else {
              self.debugLog('boost is off restoring controlmode manu')
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
        self.debugLog('BOOST STATE is %s (%s)', self.boostState, (self.boostState > 0))
        self.boostMode.updateValue((self.boostState > 0))
      })
    }

    let strValveState = this.getDataPointNameFromSettings('ValveState', null)
    if (strValveState) {
    // check if there is a VALVE_STATE datapoint and add the valve
      if (await this._ccu.hazDatapoint(this.buildAddress(strValveState))) {
        const EveHomeKitValveTypes = require(path.join(__dirname, 'EveValve.js'))
        let eveValve = new EveHomeKitValveTypes(this.gatoHomeBridge.hap)
        this.service.addOptionalCharacteristic(eveValve.Characteristic.CurrentValveState)
        let chValve = this.service.getCharacteristic(eveValve.Characteristic.CurrentValveState)
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
    }
    this.addLowBatCharacteristic()
  }

  async getMinMaxTemp () {
    this.debugLog('Fetching setTemp boundaries from device')
    let deviceMasterData = await this._ccu.sendInterfaceCommand(this._interf, 'getParamset', [this._serial, 'MASTER'])
    if (deviceMasterData) {
      let minKey = this.getDataPointNameFromSettings('minTemp', null)
      let maxKey = this.getDataPointNameFromSettings('maxTemp', null)
      if ((minKey) && (maxKey)) {
        this.minSetTemp = deviceMasterData[minKey] || 4.5
        this.maxSetTemp = deviceMasterData[maxKey] || 30.5
      }
    }
    this.debugLog('min %s | max %s will be used in homekit for this device', this.minSetTemp, this.maxSetTemp)
  }

  async processSetTempEvent (Characteristic, newValue) {
    this.targetTemperature = parseFloat(newValue)
    this.debugLog('setTemperature Event is %s °C', newValue)

    if (!this.lockModes) {
      if (this.tarHeatingState) {
        let modes = await this.calculateHeatingCoolingState(Characteristic)
        this.debugLog('setModes is %s', modes)
        this.lastMode = modes.currentMode
        this.updateCharacteristic(this.curHeatingState, modes.currentMode)
        this.updateCharacteristic(this.tarHeatingState, modes.targetMode)
      }
      this.debugLog('targetTemperature is %s', this.targetTemperature)
      this.updateCharacteristic(this.tarTemperatureChar, this.targetTemperature)
    }
  }

  async processSetControlEvent (Characteristic, newValue) {
    if (this.lockModes) {
      this.debugLog('event ControlMode ModeChange is locked due to manual set')
      return
    }
    this.debugLog('event ControlMode is %s', newValue)
    this.controlMode = parseInt(newValue)
    let modes = await this.calculateHeatingCoolingState(Characteristic)
    this.debugLog('processSetControlEvent set current Mode %s set targetMode %s', modes.currentMode, modes.targetMode)
    this.lastMode = modes.currentMode
    this.updateCharacteristic(this.curHeatingState, modes.currentMode)
    this.updateCharacteristic(this.tarHeatingState, modes.targetMode)
  }

  async calculateHeatingCoolingState (Characteristic) {
    // We have to calculate the  state depending on the controlmode
    let result = {}
    // if not set update the values - further updates will come thru events
    if (this.targetTemperature === -255) {
      this.debugLog('unknown target temp request it...')
      let value = await this.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
      if (value) {
        this.debugLog('result for target temperature is %s', value)
        this.targetTemperature = parseFloat(value)
      }
    }

    if (this.currentTemperature === -255) {
      this.debugLog('unknown current temp request it...')
      let value = await this.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
      if (value) {
        this.debugLog('result for current temperature is %s', value)
        this.currentTemperature = parseFloat(value)
      }
    }

    if ((this.controlMode === undefined) && (this.tarHeatingState)) {
      this.debugLog('setTemp != offTemp getControlMode')
      await this.getControlMode()
    }

    this.debugLog('getting Mode from these Values : CT: %s  TT: %s CM: %s',
      this.currentTemperature, this.targetTemperature, this.controlMode)

    switch (this.controlMode) {
      case 0:
        this.debugLog('targetMode = AUTO')
        this.debugLog('currentMode = AUTO')
        result.targetMode = Characteristic.TargetHeatingCoolingState.AUTO
        result.currentMode = Characteristic.CurrentHeatingCoolingState.AUTO
        break
      case 1:
      case 2:
        this.debugLog('targetMode = HEAT (Manu fromCCU)')
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        this.debugLog('currentMode = HEAT (Manu fromCCU)')
        result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
        break
      case 3:
        this.debugLog('targetMode = HEAT (Boost fromCCU)')
        result.targetMode = Characteristic.TargetHeatingCoolingState.HEAT
        // when Boost the mode is heating
        this.debugLog('currentMode = HEAT (Boost fromCCU)')
        result.currentMode = Characteristic.CurrentHeatingCoolingState.HEAT
    }

    if (this.targetTemperature === this.offTemp) {
      this.debugLog('targetMode = OFF (tagetTemp == offTemp)')
      result.currentMode = Characteristic.CurrentHeatingCoolingState.OFF
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

  async setControlMode (newMode) {
    if (this.controlMode === newMode) {
      // do nothing when we allready in this mode
      return
    }
    if (this.tarHeatingState !== undefined) { // only set control modes if we have a target Heating state which means we know how to set the mode
      let self = this
      this.debugLog('setControlMode %s', newMode)
      switch (newMode) {
        case 0: // OFF
        // set ControlMode to manu
          this.lockModes = true

          // check if we have a last temp
          if ((this.lastTemperature === -255) || (this.lastTemperature === this.offTemp)) {
            this.debugLog('first Run unknown lastTemp so fetch the current Temp from CCU')
            let fValue = await this.getValueForDataPointNameWithSettingsKey('SetTemperature', null, false)
            this.lastTemperature = fValue // First Start get the target Temp from the thermostat
            this.debugLog('CCU returns %s °C for lastTemo. Save it and return', this.lastTemperature)
          }

          this.targetTemperature = this.offTemp
          this.debugLog('setControlMode OFF - Manu Mode targetTemp is %s', this.targetTemperature)
          this.debugLog('setManu Mode in CCU and OffTemp %s', this.targetTemperature)

          this.setValueForDataPointNameWithSettingsKey('SetManuMode', null, this.getDataPointValueFromSettings('SetManuMode'))
          this.controlMode = 0
          this.debugLog('Will set Target Temp in CCU to %s', this.targetTemperature)
          this.setValueForDataPointNameWithSettingsKey('SetTemperature', null, this.targetTemperature).then(() => {
            setTimeout(() => {
              self.lockModes = false
              self.debugLog('setControlMode OFF unlock events')
            }, 2000)
          })
          break
        case 1: // HEAT

          this.controlMode = 1
          this.targetTemperature = this.lastTemperature
          this.lockModes = true

          this.debugLog('Will set Target Temp in CCU to %s', this.lastTemperature)
          this.debugLog('setControlMode HEAT - Manu Mode lastTemperature is %s', this.lastTemperature)
          let newMode = this.getDataPointValueFromSettings('SetManuMode')
          this.debugLog('setControlMode HEAT - set Manu Mode in thermostat %s', newMode)
          await this.setValueForDataPointNameWithSettingsKey('SetManuMode', null, newMode)
          this.setValueForDataPointNameWithSettingsKey('SetTemperature', null, this.lastTemperature).then(() => {
            setTimeout(() => {
              self.lockModes = false
              self.debugLog('setControlMode HEAT unlock events')
            }, 2000)
          })

          break
        case 3: // AUTO
          this.lockModes = true
          this.debugLog('setControlMode AUTO - Auto Mode')
          this.setValueForDataPointNameWithSettingsKey('SetAutoMode', null, this.getDataPointValueFromSettings('SetAutoMode')).then(() => {
            self.controlMode = 3
            setTimeout(() => {
              self.lockModes = false
              self.debugLog('setControlMode AUTO unlock events')
            }, 2000)
          })
          break

        default:
          break
      }
    }
  }

  updateHistory () {
    // do not add the first 0 after reboot
    if ((this.currentTemperature !== -255) && (this.currentHumidity !== -255)) {
      this.addLogEntry({temp: this.currentTemperature, pressure: 0, humidity: this.currentHumidity})
    }
  }

  static channelTypes () {
    return ['CLIMATECONTROL_RT_TRANSCEIVER', 'THERMALCONTROL_TRANSMIT', 'CLIMATECONTROL_REGULATOR']
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
        ValveState: {name: 'VALVE_STATE'},
        minTemp: {name: 'TEMPERATURE_MINIMUM'},
        maxTemp: {name: 'TEMPERATURE_MAXIMUM'}
      },
      'THERMALCONTROL_TRANSMIT': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        SetTemperature: {name: 'SET_TEMPERATURE'},
        Humidity: {name: 'ACTUAL_HUMIDITY'},
        ControlMode: {name: 'CONTROL_MODE'},
        SetManuMode: {name: 'MANU_MODE', value: 1},
        SetAutoMode: {name: 'AUTO_MODE', value: 1},
        minTemp: {name: 'TEMPERATURE_MINIMUM'},
        maxTemp: {name: 'TEMPERATURE_MAXIMUM'}
      },
      'CLIMATECONTROL_REGULATOR': {
        Temperature: {name: '1.TEMPERATURE'},
        SetTemperature: {name: 'SETPOINT'},
        Humidity: {name: '1.HUMIDITY'}
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
