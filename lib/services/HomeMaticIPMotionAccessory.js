/*
 * File: HomeMaticIPMotionAccessory.js
 * Project: hap-homematic
 * File Created: Friday, 13th March 2020 7:10:46 pm
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
const HomeMaticMotionAccessory = require(path.join(__dirname, 'HomeMaticMotionAccessory.js'))

class HomeMaticIPMotionAccessory extends HomeMaticMotionAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    super.publishServices(Service, Characteristic)
    let settings = this.getDeviceSettings()
    this.useActive = (settings.useActive) ? settings.useActive : false

    // add a optional Active Switch
    if (this.useActive) {
      if (this.getDataPointNameFromSettings('active', null) !== undefined) {
        this.motionSensor.addOptionalCharacteristic(Characteristic.On)
        this.activeCharacteristic = this.motionSensor.getCharacteristic(Characteristic.On)

          .on('get', (callback) => {
            self.getValueForDataPointNameWithSettingsKey('active', null, false).then((value) => {
              if (callback) callback(null, self.isTrue(value))
            })
          })

          .on('set', (value, callback) => {
            self.setValueForDataPointNameWithSettingsKey('active', null, value)
            callback()
          })

        this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('active', null, (newValue) => {
          self.activeCharacteristic.updateValue(self.isTrue(newValue), null)
        })
      }
    }

    this.addBatteryLevelStatus()
  }

  initServiceSettings () {
    return {
      '*': {
        motion: 'MOTION',
        illumination: 'ILLUMINATION',
        active: 'MOTION_DETECTION_ACTIVE'
      }
    }
  }

  static channelTypes () {
    return ['MOTIONDETECTOR_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a motion sensor in HomeKit'
  }

  static configurationItems () {
    return {
      'useActive': {
        type: 'checkbox',
        default: false,
        label: 'Add Active Switch',
        hint: 'adds a switch to turn the sensor on and off'
      }
    }
  }
}

module.exports = HomeMaticIPMotionAccessory
