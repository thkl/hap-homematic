/*
 * File: HomeMaticKeyMaticIPAccessAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 18th April 2021 2:46:37 pm
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

module.exports = class HomeMaticKeyMaticIPAccessAccessory extends HomeMaticAccessory {
  publishServices(Service, Characteristic) {
    let self = this
    let channelz = [2, 3, 4, 5, 6, 7, 8, 9]

    channelz.forEach(channel => {
      const service = self.addService(new Service.Switch(`${self._name} - ${channel}`, channel))
      const isOnCharacteristic = service.getCharacteristic(Characteristic.On)

      isOnCharacteristic.on('get', (callback) => {
        self.getValue(`${channel}.STATE`, true).then(value => {
          callback(null, self.isTrue(value))
        })
      })

      isOnCharacteristic.on('set', async (value, callback) => {
        if (value === false) {
          self.setValue(`${channel}.ACCESS_AUTHORIZATION`, 0)
        } else {
          self.setValue(`${channel}.ACCESS_AUTHORIZATION`, 1)
        }
        callback()
      })

      self.registerAddressForEventProcessingAtAccessory(self.buildAddress(`${channel}.STATE`), (newValue) => {
        self.debugLog('event state %s', newValue)
        self.updateCharacteristic(isOnCharacteristic, self.isTrue(newValue))
      })

    })
  }

  static channelTypes() {
    return ['ACCESS_RECEIVER']
  }

  static serviceDescription() {
    return 'This service provides switches to operate the KeyMaticIP Accessrights channels'
  }

  static configurationItems() {
    return {}
  }
}
