/*
 * File: HomeMaticFillingSensorAccessory.js
 * Project: hap-homematic
 * File Created: Tuesday, 29th September 2020 7:31:18 pm
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

class HomeMaticFillingSensorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.service = this.getService(Service.HumiditySensor)
    this.char = this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    this.active = this.service.getCharacteristic(Characteristic.StatusActive)
    this.enableLoggingService('weather', false)

    this.char.on('get', async (callback) => {
      let lvl = parseInt(self.getValue('LEVEL', true))
      callback(null, lvl)
    })
    this.char.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('LEVEL'), (newValue) => {
      let lvl = parseInt(newValue)
      self.updateCharacteristic(self.char, lvl)
    })

    this.active.on('get', (callback) => {
      callback(null, true)
    })

    this.updateCharacteristic(this.active, true)
  }

  static channelTypes () {
    return ['CAPACITIVE_FILLING_LEVEL_SENSOR']
  }

  static serviceDescription () {
    return 'This service provides a filling sensor'
  }

  static async configurationItems (ccu) {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticFillingSensorAccessory
