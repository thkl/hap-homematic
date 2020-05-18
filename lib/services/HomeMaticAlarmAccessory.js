/*
 * File: HomeMaticAlarmAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 16th March 2020 12:16:09 pm
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

class HomeMaticAlarmAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.sensor = this.getService(Service.SecuritySystem)

    this.currentState = this.sensor.getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .on('get', (callback) => {
        self.getValueForDataPointNameWithSettingsKey('state', 'armstate', false).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('armstate', null, value))
          }
        })
      })

    this.targetState = this.sensor.getCharacteristic(Characteristic.SecuritySystemTargetState)
      .on('set', (value, callback) => {
        let hkValue = self.getDataPointResultMapping('armstate', null, value, 'mappingTarget', true)
        self.log.debug('[ALSY] HK %s mapped to %s ', value, hkValue)
        self.setValueForDataPointNameWithSettingsKey('state', 'armstate', hkValue)
        callback()
      })
      .on('get', (callback) => {
        self.getValueForDataPointNameWithSettingsKey('state', 'armstate', false).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('armstate', null, value, 'mappingTarget'))
          }
        })
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', 'armstate', (newValue) => {
      let mappetTargetValue = self.getDataPointResultMapping('armstate', null, newValue, 'mappingTarget')
      self.log.debug('[ALSY] HK %s mapped to %s ', newValue, mappetTargetValue)
      self.targetState.updateValue(mappetTargetValue, null)
      setTimeout(() => {
        let mappedValue = self.getDataPointResultMapping('armstate', null, newValue)
        self.currentState.updateValue(mappedValue, null)
        self.systemCurrentState = mappedValue
      }, 100)
    })

    // register all 3 Alarm Channels
    let alTypes =
    ['intalarm',
      'extalarm',
      'panic']

    alTypes.map(atype => {
      self.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', atype, (newValue) => {
        if (self.isTrue(newValue)) {
          self.currentState.setValue(Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED, null)
        } else {
          self.currentState.setValue(self.systemCurrentState, null)
        }
      })
    })

    this.addTamperedCharacteristic(this.sensor, 4)
    this.addLowBatCharacteristic(this.sensor, 4)
  }

  static channelTypes () {
    return ['ARMING']
  }

  static serviceDescription () {
    return 'This service provides a alarm system for HomeKit'
  }

  initServiceSettings (Characteristic) {
    return {
      '*': {
        'intalarm': {
          'state': '1.STATE'
        },
        'extalarm': {
          'state': '2.STATE'
        },
        'panic': {
          'state': '3.STATE'
        },
        'armstate': {
          'state': 'ARMSTATE',
          number: true,
          mapping: {
            0: Characteristic.SecuritySystemCurrentState.STAY_ARM,
            1: Characteristic.SecuritySystemCurrentState.NIGHT_ARM,
            2: Characteristic.SecuritySystemCurrentState.AWAY_ARM,
            3: Characteristic.SecuritySystemCurrentState.DISARMED
          },
          mappingTarget: {
            0: Characteristic.SecuritySystemTargetState.STAY_ARM,
            1: Characteristic.SecuritySystemTargetState.NIGHT_ARM,
            2: Characteristic.SecuritySystemTargetState.AWAY_ARM,
            3: Characteristic.SecuritySystemTargetState.DISARM
          }
        }
      }
    }
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticAlarmAccessory
