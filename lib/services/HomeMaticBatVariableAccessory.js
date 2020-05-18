/*
 * File: HomeMaticBatVariableAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 28th March 2020 7:40:28 pm
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

class HomeMaticBatVariableAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.BatteryService(this._name))
    let settings = this.getDeviceSettings()
    this.lowLevelValue = ((settings.lowLevelValue !== undefined) && (settings.lowLevelValue > 0)) ? parseInt(settings.lowLevelValue) : undefined

    this.levelCharacteristic = service.getCharacteristic(Characteristic.BatteryLevel)
      .on('get', (callback) => {
        self._ccu.getVariableValue(self._serial).then((newValue) => {
          callback(null, parseInt(newValue))
        })
      })
      .on('set', (value, callback) => {
        callback()
      })

    service.getCharacteristic(Characteristic.ChargingState)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })
      .on('set', (value, callback) => {
        callback()
      })

    if (this.lowLevelValue) {
      this.lowLevelCharacteristic = service.getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', (callback) => {
          self._ccu.getVariableValue(self._serial).then((newValue) => {
            callback(null, parseFloat(newValue) < self.lowLevelValue)
          })
        })
        .on('set', (value, callback) => {
          callback()
        })
    }
    this.updateVariable()
  }

  async updateVariable () {
    let newValue = await this._ccu.getVariableValue(this._serial)
    this.levelCharacteristic.updateValue(parseInt(newValue), null)
    if (this.lowLevelValue) {
      this.lowLevelCharacteristic.updateValue((parseFloat(newValue) < this.lowLevelValue), null)
    }
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a battery indicator based on a HomeMatic variable'
  }

  static configurationItems () {
    return {
      'lowLevelValue': {
        type: 'number',
        default: 0,
        label: 'LowLevel Value',
        hint: 'Battery level below this will trigger a LowLevel message'
      }
    }
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticBatVariableAccessory
