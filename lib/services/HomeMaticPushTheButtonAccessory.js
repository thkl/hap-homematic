/*
 * File: HomeMaticPushTheButtonAccessory.js
 * Project: hap-homematic
 * File Created: Thursday, 30th April 2020 8:15:03 pm
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

class HomeMaticPushTheButtonAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let evntType = this.getDeviceSettings().evntType || 'PRESS_SHORT'

    if (evntType === 'BOTH') {
      this.createEventSwitch('_Short', 'PRESS_SHORT', Service, Characteristic)
      this.createEventSwitch('_Long', 'PRESS_LONG', Service, Characteristic)
    } else {
      this.createEventSwitch(undefined, evntType, Service, Characteristic)
    }
  }

  createEventSwitch (name, event, Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.Switch(this._name + name, name))
    let isOn = service.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })
      .on('set', (value, callback) => {
        self.setValue(event, true)
        setTimeout(() => {
          isOn.updateValue(false, null)
        }, 500)
        callback()
      })
  }

  static channelTypes () {
    return ['KEY', 'VIRTUAL_KEY', 'KEY_TRANSCEIVER', 'MULTI_MODE_INPUT_TRANSMITTER']
  }

  static configurationItems () {
    return {
      'evntType': {
        type: 'option',
        array: ['PRESS_SHORT', 'PRESS_LONG', 'BOTH'],
        default: 'PRESS_SHORT',
        label: 'Key Event',
        hint: 'Which event should be fired'
      }
    }
  }

  static filterDevice () {
    return ['HmIP-ASIR', 'HmIP-ASIR-B1', 'HmIP-ASIR-2', 'HmIP-ASIR-O', 'HmIP-BBL']
  }

  static serviceDescription () {
    return 'This service provides a switch HomeKit which will press the assigned key at your ccu'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticPushTheButtonAccessory
