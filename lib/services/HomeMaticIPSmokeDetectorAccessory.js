/*
 * File: HomeMaticIPSmokeDetectorAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 28th March 2020 12:23:38 pm
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

class HomeMaticIPSmokeDetectorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let settings = this.getDeviceSettings()
    this.memyselfandi = settings.single_alarm || false

    let sensor = this.addService(new Service.SmokeSensor(this._name))
    this.detectorstate = sensor.getCharacteristic(Characteristic.SmokeDetected)
      .on('get', (callback) => {
        self.getValue('SMOKE_DETECTOR_ALARM_STATUS', true).then((value) => {
          switch (parseInt(value)) {
            case 0: // idle
              if (callback) callback(null, false)
              break
            case 1: // primary alarm
              if (callback) callback(null, true)
              break
            case 2: // INTRUSION_ALARM
              if (callback) callback(null, true)
              break
            case 3: // SECONDARY_ALARM only set if not a single signaling
              if (self.memyselfandi !== true) {
                if (callback) callback(null, true)
              } else {
                if (callback) callback(null, false)
              }
              break
            default:
              if (callback) callback(null, false)
              break
          }
        })
      })
    this.detectorstate.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('SMOKE_DETECTOR_ALARM_STATUS'), (newValue) => {
      self.log.debug('[IPSDS] event %s', newValue)
      switch (newValue) {
        case 0: // idle
          self.detectorstate.updateValue(false, null)
          break
        case 1: // primary alarm
          self.detectorstate.updateValue(true, null)
          break
        case 2: // INTRUSION_ALARM
          self.detectorstate.updateValue(true, null)
          break
        case 3: // SECONDARY_ALARM only set if not a single signaling
          if (self.memyselfandi !== true) {
            self.detectorstate.updateValue(true, null)
          }
          break
      }
    })

    // This one haz LOWBAt on channel 1
    if (this._deviceType === 'HmIP-SWSD') {
      this.addLowBatCharacteristic(0)
    }
  }

  static channelTypes () {
    return ['HmIP-SWSD:SMOKE_DETECTOR']
  }

  static configurationItems () {
    return {
      'single_alarm': {
        type: 'checkbox',
        default: false,
        label: 'Detect single alarms',
        hint: ''
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a smoke detector in HomeKit'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticIPSmokeDetectorAccessory
