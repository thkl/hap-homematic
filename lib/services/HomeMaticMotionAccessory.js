/*
 * File: HomeMaticMotionAccessory.js
 * Project: hap-homematic
 * File Created: Friday, 13th March 2020 5:18:43 pm
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

class HomeMaticMotionAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    if (this.getDataPointNameFromSettings('motion', null)) {
      this.motionSensor = this.addService(new Service.MotionSensor(this._name, 'Motion'))

      this.motionSensor.getCharacteristic(Characteristic.StatusActive)
        .on('get', (callback) => {
          callback(null, true)
        })

      this.motionDetected = this.motionSensor.getCharacteristic(Characteristic.MotionDetected)
        .on('get', (callback) => {
          self.getValueForDataPointNameWithSettingsKey('motion', null, false).then((value) => {
            if (callback) callback(null, self.isTrue(value))
          })
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('motion', null, (newValue) => {
        self.motionDetected.updateValue(self.isTrue(newValue), null)
        self.addLogEntry({
          status: self.isTrue(newValue) ? 1 : 0
        })

        if (self.isTrue(newValue)) {
          self.updateLastActivation()
        }

        self.initialQuery = false
        self.lastValue = newValue
      })

      // Enable all Eve Logging Services for this device
      this.enableLoggingService('motion', false)
    }

    // Add a Brightness Sensor if the device haze one
    if (this.getDataPointNameFromSettings('illumination', null) !== undefined) {
      this.illuminationSensor = this.addService(new Service.LightSensor(this._name + ' Illumination', 'Illumination'))

      this.illuminationLevel = this.illuminationSensor.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .on('get', (callback) => {
          self.getValueForDataPointNameWithSettingsKey('illumination', null, false).then((value) => {
            if (callback) callback(null, parseFloat(value))
          })
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('illumination', null, (newValue) => {
        self.illuminationLevel.updateValue(parseFloat(newValue), null)
      })
      if (this.motionSensor) {
        this.motionSensor.addLinkedService(this.illuminationSensor)
      }
    }
    if (this.motionSensor) {
      this.homeKitAccessory.setPrimaryService(this.motionSensor)
    }
    // enable the last Opened Service
    this.addLastActivationService(this.motionSensor)
    this.addTamperedCharacteristic(this.motionSensor)
    if (this._ccuType === 'MOTION_DETECTOR') {
      this.addLowBatCharacteristic(this.motionSensor)
    }
  }

  initServiceSettings () {
    return {
      '*': {
        motion: 'MOTION',
        illumination: 'BRIGHTNESS'
      },
      'TILT_SENSOR': {
        motion: 'STATE'
      }
    }
  }

  static channelTypes () {
    return ['MOTION_DETECTOR', 'TILT_SENSOR']
  }

  static configurationItems () {
    return {}
  }

  static serviceDescription () {
    return 'This service provides a motion sensor in HomeKit'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticMotionAccessory
