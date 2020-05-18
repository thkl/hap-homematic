/*
 * File: HomeMaticIPLeakSensorAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 2nd May 2020 3:25:34 pm
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

class HomeMaticIPLeakSensorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    var self = this
    var leakSensor = this.getService(Service.LeakSensor)
    let evntType = this.getDeviceSettings().evntType || 'WATERLEVEL_DETECTED'

    this.state = leakSensor.getCharacteristic(Characteristic.LeakDetected)
      .on('get', (callback) => {
        self.getValue(evntType, false).then(value => {
          if (callback) {
            self.log.debug('[IPLSA] return status')
            callback(null, ((self.isTrue(value)) ? 1 : 0))
          }
        })
      })

    this.state.eventEnabled = true

    this.enableLoggingService('motion')
    this.addLastActivationService(leakSensor)

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress(evntType), (newValue) => {
      self.log.debug('[IPLSA] Leak State event %s', newValue)
      let leakDetected = (self.isTrue(newValue))
      if (leakDetected) {
        self.state.updateValue(1, null)
        self.updateLastActivation()
        self.addLogEntry({status: leakDetected ? 1 : 0})
      } else {
        self.state.updateValue(0, null)
      }
    })
  }

  static serviceDescription () {
    return 'This service provides a leak sensor in HomeKit'
  }

  static configurationItems () {
    return {
      'evntType': {
        type: 'option',
        array: ['MOISTURE_DETECTED', 'WATERLEVEL_DETECTED'],
        default: 'WATERLEVEL_DETECTED',
        label: 'Leak event',
        hint: 'on which event should the sensor fire a leak message'
      }
    }
  }

  static channelTypes () {
    return ['WATER_DETECTION_TRANSMITTER']
  }
}
module.exports = HomeMaticIPLeakSensorAccessory
