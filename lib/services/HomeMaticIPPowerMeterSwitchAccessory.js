/*
 * File: HomeMaticIPPowerMeterSwitchAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 14th March 2020 4:58:08 pm
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
const HomeMaticPowerMeterSwitchAccessory = require(path.join(__dirname, 'HomeMaticPowerMeterSwitchAccessory.js'))

class HomeMaticIPPowerMeterSwitchAccessory extends HomeMaticPowerMeterSwitchAccessory {
  initServiceSettings () {
    return {
      'HmIP-BSM': {
        roChannel: 4,
        switch: '4.STATE',
        ontime: '4.ON_TIME',
        power: 'POWER',
        current: 'CURRENT',
        voltage: 'VOLTAGE',
        frequency: 'FREQUENCY',
        energyCounter: 'ENERGY_COUNTER'
      },
      '*': {
        roChannel: 3,
        switch: '3.STATE',
        ontime: '3.ON_TIME',
        power: 'POWER',
        current: 'CURRENT',
        voltage: 'VOLTAGE',
        frequency: 'FREQUENCY',
        energyCounter: 'ENERGY_COUNTER'
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a power meter in HomeKit (this only works in eve)'
  }

  static channelTypes () {
    return ['ENERGIE_METER_TRANSMITTER']
  }
}
module.exports = HomeMaticIPPowerMeterSwitchAccessory
