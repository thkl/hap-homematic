/*
 * File: HomeMaticRotaryWindowAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 8th June 2020 4:13:11 pm
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
const HomeMaticDoorAccessory = require(path.join(__dirname, 'HomeMaticDoorAccessory.js'))

class HomeMaticRotaryWindowAccessory extends HomeMaticDoorAccessory {
  initAccessoryService (Service) {
    this.service = this.getService(Service.Window)
  }

  static channelTypes () {
    return ['ROTARY_HANDLE_SENSOR', 'ROTARY_HANDLE_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a window device in HomeKit based on a ccu rotary sensor'
  }

  initServiceSettings () {
    return {
      'ROTARY_HANDLE_SENSOR': {
        state: {name: 'STATE', number: true, mapping: {1: 15, 2: 100, 0: 0}, history: {1: 1, 2: 1, 0: 0}}
      },

      'ROTARY_HANDLE_TRANSCEIVER': {
        voltage: 1.2,
        state: {name: 'STATE', number: true, mapping: {1: 15, 2: 100, 0: 0}, history: {1: 1, 2: 1, 0: 0}}
      }
    }
  }
}
module.exports = HomeMaticRotaryWindowAccessory
