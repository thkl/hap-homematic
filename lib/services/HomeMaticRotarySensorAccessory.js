/*
 * File: HomeMaticRotarySensorAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 14th March 2020 8:00:55 pm
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
const HomeMaticContactSensorAccessory = require(path.join(__dirname, 'HomeMaticContactSensorAccessory.js'))

class HomeMaticRotarySensorAccessory extends HomeMaticContactSensorAccessory {
  initServiceSettings () {
    return {
      '*': {
        state: {name: 'STATE', number: true, mapping: {1: true, 2: true, 0: false}, history: {1: 1, 2: 1, 0: 0}}
      }
    }
  }

  static channelTypes () {
    return ['ROTARY_HANDLE_SENSOR', 'ROTARY_HANDLE_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a contact in HomeKit based on a rotary sensor from your ccu'
  }
}
module.exports = HomeMaticRotarySensorAccessory
