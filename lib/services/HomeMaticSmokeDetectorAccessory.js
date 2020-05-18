/*
 * File: HomeMaticSmokeDetectorAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 28th March 2020 12:14:19 pm
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

class HomeMaticSmokeDetectorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let sensor = this.addService(new Service.SmokeSensor(this._name))

    let active = sensor.getCharacteristic(Characteristic.StatusActive)
      .on('get', (callback) => {
        callback(null, true)
      })
    active.updateValue(true, null)

    this.detectorstate = sensor.getCharacteristic(Characteristic.SmokeDetected)
      .on('get', (callback) => {
        self.getValue('STATE', true).then((value) => {
          if (callback) callback(null, self.isTrue(value))
        })
      })
    this.detectorstate.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      self.log.debug('[SDS] event %s', newValue)
      self.detectorstate.updateValue(self.isTrue(newValue), null)
    })

    // This one haz LOWBAt on channel 1
    if ((this._deviceType === 'HM-Sec-SD-2') || (this._deviceType === 'HM-Sec-SD-2-Generic')) {
      this.addLowBatCharacteristic(1)

      this.addFaultCharacteristic(sensor, '1:ERROR_SMOKE_CHAMBER', (value) => {
        return (parseInt(value) === 1)
      })
    }
  }

  static channelTypes () {
    return [
      'HM-Sec-SD:SMOKE_DETECTOR',
      'HM-Sec-SD-Generic:SMOKE_DETECTOR',
      'HM-Sec-SD-2:SMOKE_DETECTOR',
      'HM-Sec-SD-2-Generic:SMOKE_DETECTOR',
      'SMOKE_DETECTOR_TEAM',
      'SMOKE_DETECTOR_TEAM_V2']
  }

  static configurationItems () {
    return {}
  }

  static serviceDescription () {
    return 'This service provides a smoke detector in HomeKit'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticSmokeDetectorAccessory
