/*
 * File: HomeMaticRainDetectorAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 29th March 2020 2:05:47 pm
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

class HomeMaticRainDetectorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    var self = this
    var rainSensor = this.getService(Service.HumiditySensor)

    this.state = rainSensor.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', (callback) => {
        self.getValue('STATE', false).then(value => {
          if (callback) {
            callback(null, self.isTrue(value) ? 100 : 0)
          }
        })
      })

    this.state.eventEnabled = true

    this.enableLoggingService('motion')
    this.addLastActivationService(rainSensor)

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      self.log.debug('[RAIN] Rain State event %s', newValue)
      let rainDetected = self.isTrue(newValue)
      if (rainDetected) {
        self.state.updateValue(100, null)
        self.updateLastActivation()
        self.addLogEntry({status: rainDetected ? 1 : 0})
      } else {
        self.state.updateValue(0, null)
      }
    })
  }

  static serviceDescription () {
    return 'This service provides a humidity sensor'
  }

  static channelTypes () {
    return ['RAINDETECTOR']
  }
}
module.exports = HomeMaticRainDetectorAccessory
