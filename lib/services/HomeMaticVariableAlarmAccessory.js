/*
 * File: HomeMaticVariableAlarmAccessory.js
 * Project: hap-homematic
 * File Created: Thursday, 21st May 2020 5:18:55 pm
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

class HomeMaticVariableAlarmAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    // get mapping
    this.mapping = {
      0: self.getDeviceSettings().STAY_ARM || 0,
      1: self.getDeviceSettings().AWAY_ARM || 1,
      2: self.getDeviceSettings().NIGHT_ARM || 2,
      3: self.getDeviceSettings().DISARMED || 3,
      4: self.getDeviceSettings().ALARM_TRIGGERED || 4
    }
    this.sensor = this.getService(Service.SecuritySystem)

    this.currentState = this.sensor.getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .on('get', (callback) => {
        let result = 0
        self._ccu.getVariableValue(self.nameInCCU).then((newValue) => {
          Object.keys(self.mapping).map((key) => {
            if (parseInt(newValue) === self.mapping[key]) {
              result = key
            }
          })
        })
        if (callback) {
          callback(null, result)
        }
      })
    this.currentState.eventEnabled = true

    this.targetState = this.sensor.getCharacteristic(Characteristic.SecuritySystemTargetState)
      .on('get', (callback) => {
        let result = 0
        self._ccu.getVariableValue(self.nameInCCU).then((newValue) => {
          Object.keys(self.mapping).map((key) => {
            if (parseInt(newValue) === self.mapping[key]) {
              result = key
            }
          })
        })
        if (callback) {
          callback(null, result)
        }
      })
      .on('set', (newValue, callback) => {
        // get the hm value
        let hmValue = self.mapping[parseInt(newValue)]
        self.log.debug('[VALRM] set %s will be mapped to %s', newValue, hmValue)
        self._ccu.setVariable(self.nameInCCU, hmValue)
        setTimeout(() => {
          self.updateVariable()
        }, 250)
        if (callback) {
          callback()
        }
      })
    this.targetState.eventEnabled = true
  }

  async updateVariable () {
    let self = this
    let result = false
    let newValue = parseInt(await this._ccu.getVariableValue(this.nameInCCU))
    Object.keys(self.mapping).map((key) => {
      if (newValue === self.mapping[key]) {
        result = key
      }
    })
    self.log.debug('[VALRM] updateVariable HM is %s HK %s', newValue, result)

    if (result !== false) {
      if (result !== 4) {
        // target state triggered is not allowed
        this.targetState.updateValue(result, null)
      }
      setTimeout(() => {
        self.currentState.updateValue(result, null)
      }, 100)
    }
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static configurationItems () {
    return {
      'STAY_ARM': {
        type: 'number',
        default: 0,
        label: 'Value for stay',
        hint: 'The value of your HomeMatic variable when it says you are at home',
        mandatory: false
      },
      'AWAY_ARM': {
        type: 'number',
        default: 1,
        label: 'Value for away',
        hint: 'The value of your HomeMatic variable when it says you are away',
        mandatory: false
      },
      'NIGHT_ARM': {
        type: 'number',
        default: 2,
        label: 'Value for night',
        hint: 'The value of your HomeMatic variable when it says your home internal secured',
        mandatory: false
      },
      'DISARMED': {
        type: 'number',
        default: 3,
        label: 'Value for disarmed',
        hint: 'The value of your HomeMatic variable when it says the alarm system is off.',
        mandatory: false
      },
      'ALARM_TRIGGERED': {
        type: 'number',
        default: 4,
        label: 'Value for alarm',
        hint: 'The value of your HomeMatic variable when all the red lights are flashing.',
        mandatory: false
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a alarm system based on a variable'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticVariableAlarmAccessory
