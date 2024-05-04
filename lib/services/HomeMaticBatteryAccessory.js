/*
 * File: HomeMaticBatteryAccessory.js
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

class HomeMaticBatteryAccessory extends HomeMaticAccessory {
  publishServices(Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.BatteryService(this._name))
    let settings = this.getDeviceSettings()
    this.lowLevelValue = ((settings.lowLevelValue !== undefined) && (settings.lowLevelValue > 0)) ? parseInt(settings.lowLevelValue) : undefined
    this.maxLevelValue = ((settings.maxLevelValue !== undefined) && (settings.maxLevelValue > 0)) ? parseInt(settings.maxLevelValue) : 0
    this.datapoint = settings.datapoint;
    this.levelCharacteristic = service.getCharacteristic(Characteristic.BatteryLevel)
      .on('get', (callback) => {
        this.getValue(this.datapoint, true).then(newValue => {
          let level = parseFloat(newValue) / (parseFloat(this.maxLevelValue) / 100)
          callback(null, parseInt(level))
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
          this.getValue(this.datapoint, true).then(newValue => {
            callback(null, parseFloat(newValue) < self.lowLevelValue);
          });
        })
        .on('set', (value, callback) => {
          callback()
        })
    }
    this.updateChannel()
  }

  async updateChannel() {
    let newValue = await this.getValue(this.datapoint, true);
    let level = parseFloat(newValue) / (parseFloat(this.maxLevelValue) / 100)
    this.levelCharacteristic.updateValue(level, null)
    if (this.lowLevelValue) {
      this.lowLevelCharacteristic.updateValue((parseFloat(newValue) < this.lowLevelValue), null)
    }
  }

  static channelTypes() {
    console.log("Bat ret sp");
    return ['SPECIAL']
  }

  static serviceDescription() {
    return 'This service provides a battery indicator based on a HomeMatic Device Datapoint'
  }

  static configurationItems() {
    return {
      'datapoint': {
        type: "text",
        default: "",
        hint: "Datapoint which contains the battery level",
        label: "Datapoint"
      },
      'lowLevelValue': {
        type: 'number',
        default: 0,
        label: 'LowLevel Value',
        hint: 'Battery level below this will trigger a LowLevel message'
      },
      'maxLevelValue': {
        type: 'number',
        default: 0,
        label: 'Max Level Value'
      }
    }
  }

  static validate(configurationItem) {
    return false
  }
}

module.exports = HomeMaticBatteryAccessory
