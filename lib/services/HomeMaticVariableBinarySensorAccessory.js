/*
 * File: HomeMaticVariableBinarySensorAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 8th June 2020 7:17:46 pm
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
const moment = require('moment')

class HomeMaticVariableBinarySensorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    if ((this.variable.valuetype === 2) && (this.variable.subtype === 2)) {
      let subType = this.getDeviceSettings().Type || 'Motion'

      switch (subType) {
        case 'Motion':
          this.service = this.getService(Service.MotionSensor)
          this.char = this.service.getCharacteristic(Characteristic.MotionDetected)
          this.active = this.service.getCharacteristic(Characteristic.StatusActive)
          this.enableLoggingService('motion', false)
          this.reverse = false
          break

        case 'Contact':
          this.service = this.getService(Service.ContactSensor)
          this.char = this.service.getCharacteristic(Characteristic.ContactSensorState)
          this.active = this.service.getCharacteristic(Characteristic.StatusActive)
          this.enableLoggingService('door', false)
          this.reverse = true
          break

        case 'Leak':
          this.service = this.getService(Service.LeakSensor)
          this.char = this.service.getCharacteristic(Characteristic.LeakDetected)
          this.active = this.service.getCharacteristic(Characteristic.StatusActive)
          this.enableLoggingService('motion', false)
          this.reverse = false
          break

        case 'Occupancy':
          this.service = this.getService(Service.OccupancySensor)
          this.char = this.service.getCharacteristic(Characteristic.OccupancyDetected)
          this.active = this.service.getCharacteristic(Characteristic.StatusActive)
          this.enableLoggingService('motion', false)
          this.reverse = false
          break

        case 'Smoke':
          this.service = this.getService(Service.SmokeSensor)
          this.char = this.service.getCharacteristic(Characteristic.SmokeDetected)
          this.active = this.service.getCharacteristic(Characteristic.StatusActive)
          this.reverse = false
          break
      }

      if (this.active) {
        this.active.on('get', (callback) => {
          callback(null, true)
        })
          .updateValue(true)
      }

      this.char.on('get', (callback) => {
        self._ccu.getVariableValue(self._serial).then((newValue) => {
          callback(null, self.isTrue(newValue) ? 1 : 0)
        })
      })

      this.char.eventEnabled = true

      if (this.loggingService) {
        this.addLastActivationService(this.service)
      }
    }

    // initial call
    this.updateVariable()
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.timer)
  }

  async updateVariable () {
    let newValue = await this._ccu.getVariableValue(this.nameInCCU)
    if (this.char) {
      this.log.info('[Variable] update state %s', this.isTrue(newValue))
      let homeKitState = this.isTrue(newValue) ? 1 : 0
      if (this.reverse) {
        homeKitState = this.isTrue(newValue) ? 0 : 1
      }
      this.updateCharacteristic(this.char, homeKitState)
      this.updateLastActivation()
      this.addLogEntry({
        status: homeKitState
      })
      this.initialQuery = false
      this.lastValue = homeKitState
    }
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a sensor with value from variables'
  }

  static configurationItems () {
    return {
      'Type': {
        type: 'option',
        array: ['Motion', 'Contact', 'Leak', 'Occupancy', 'Smoke'],
        default: 'Motion',
        label: 'Subtype of this device',
        hint: 'This device can have different sub types'
      }
    }
  }
  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticVariableBinarySensorAccessory
