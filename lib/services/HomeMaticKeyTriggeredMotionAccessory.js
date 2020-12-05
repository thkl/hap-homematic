/*
 * File: HomeMaticKeyTriggeredMotionAccessory.js
 * Project: hap-homematic
 * File Created: Friday, 4th Dec 2020 5:18:43 pm
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

class HomeMaticKeyTriggeredMotionAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    this.motionSensor = this.addService(new Service.MotionSensor(this._name, 'Motion'))

    let active = this.motionSensor.getCharacteristic(Characteristic.StatusActive)
      .on('get', (callback) => {
        callback(null, true)
      })
    active.updateValue(true, null)

    this.motionDetected = this.motionSensor.getCharacteristic(Characteristic.MotionDetected)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PRESS_SHORT'), (newValue) => {
      let motion = self.isTrue(newValue)
      self.setMotion(motion)
      if (motion === true) {
        setTimeout(() => {
          self.setMotion(false)
        }, 1000)
      }
    })

    // Enable all Eve Logging Services for this device
    this.enableLoggingService('motion', false)

    this.homeKitAccessory.setPrimaryService(this.motionSensor)
    // enable the last Opened Service
    this.addLastActivationService(this.motionSensor)
  }

  setMotion (motion) {
    this.motionDetected.updateValue(motion, null)
    this.addLogEntry({
      status: motion ? 1 : 0
    })

    if (motion === true) {
      this.updateLastActivation()
    }

    this.initialQuery = false
    this.lastValue = motion
  }

  initServiceSettings () {

  }

  static channelTypes () {
    return ['KEY', 'VIRTUAL_KEY', 'KEY_TRANSCEIVER', 'MULTI_MODE_INPUT_TRANSMITTER']
  }

  static configurationItems () {
    return {
    }
  }

  static getPriority () {
    return 1
  }

  static serviceDescription () {
    return 'This service provides a motion sensor based on a short press event in HomeKit'
  }

  static validate (configurationItem) {
    return false
  }

  static filterDevice () {
    return ['HmIP-ASIR', 'HmIP-ASIR-B1', 'HmIP-ASIR-2', 'HmIP-ASIR-O', 'HmIP-BBL']
  }
}

module.exports = HomeMaticKeyTriggeredMotionAccessory
