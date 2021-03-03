/*
 * File: HomeMaticFanAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 1st March 2021 8:41:33 pm
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
const HomeMaticDimmerAccessory = require(path.join(__dirname, 'HomeMaticDimmerAccessory.js'))

module.exports = class HomeMaticFanAccessory extends HomeMaticDimmerAccessory {
  createService (Service, Characteristic) {
    this.service = this.getService(Service.Fan)
    this.levelCharacteristic = this.service.addCharacteristic(Characteristic.RotationSpeed)
  }

  initServiceSettings () {
    return {
      'DIMMER': {
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'},
        ramp: {name: 'RAMP_TIME'}
      },
      'VIRTUAL_DIMMER': {
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'},
        ramp: {name: 'RAMP_TIME'}
      },
      'DIMMER_VIRTUAL_RECEIVER': {
        level: {name: 'LEVEL'},
        working: {name: 'PROCESS'},
        ramp: {name: 'RAMP_TIME'}
      }
    }
  }

  static getPriority () {
    return 2
  }

  static configurationItems () {
    return {
      'useRampTime': {
        type: 'checkbox',
        default: false,
        label: 'Use Ramp Time',
        hint: 'uses a dimmer ramp time to slowly set the new level'
      },
      'rampTime': {
        type: 'number',
        default: 500,
        label: 'Ramp time in ms',
        hint: 'uses a dimmer ramp time to slowly set the new level'
      },
      'OnTime': {
        type: 'number',
        default: 0,
        label: 'On Time',
        hint: 'HAP will switch off this device automatically after the given seconds. Set this to 0 to turn off this feature.'
      },
      'MinValue': {
        type: 'number',
        default: 0,
        label: 'min Dim Value',
        hint: 'This is the minium HAP will dim this light (0-100). Set this to 0 to turn off this feature.'
      },
      'MaxValue': {
        type: 'number',
        default: 0,
        label: 'max Dim Value',
        hint: 'This is the maximum HAP will dim this light (0-100). Set this to 0 to turn off this feature.'
      }
    }
  }

  static channelTypes () {
    return ['DIMMER', 'VIRTUAL_DIMMER', 'DIMMER_VIRTUAL_RECEIVER']
  }

  static serviceDescription () {
    return 'This service provides a controlable fan in HomeKit'
  }
}
