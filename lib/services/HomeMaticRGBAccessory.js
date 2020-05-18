/*
 * File: HomeMaticRGBAccessory.js
 * Project: hap-homematic
 * File Created: Thursday, 9th April 2020 7:27:28 pm
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

class HomeMaticRGBAccessory extends HomeMaticDimmerAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this
    this.color = this.lightBulbService.getCharacteristic(Characteristic.Hue)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('color', null, false)
        let hue = Math.round((value / 199) * 360)
        self.log.debug('[RGBW] get color %s HUE %s', value, hue)

        if (callback) callback(null, hue)
      })

      .on('set', (value, callback) => {
        if (self.sat < 10) {
          value = 361.809045226
        }

        let hue = Math.round((value / 360) * 199)
        self.log.debug('[RGBW] Color %s set Hue to %s', value, hue)
        self.setValueForDataPointNameWithSettingsKey('color', null, hue)
        callback()
      })

    this.color.eventEnabled = true

    this.csat = this.lightBulbService.getCharacteristic(Characteristic.Saturation)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('color', null, false)
        callback(null, (value === 200) ? 0 : 100)
      })

      .on('set', (value, callback) => {
        self.sat = value
        if (value < 10) {
          self.setValueForDataPointNameWithSettingsKey('color', null, 361.809045226)
        }
        callback()
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('color', null, (newValue) => {
      let hue = Math.round((newValue / 199) * 360)
      self.log.debug('[RGBW] event color %s HUE %s', newValue, hue)
      self.color.updateValue(hue, null)
    })
  }

  static channelTypes () {
    return ['RGBW_COLOR']
  }

  initServiceSettings () {
    return {
      'RGBW_COLOR': {
        level: {name: '1.LEVEL'},
        working: {name: '1.WORKING'},
        color: {name: '2.COLOR'}
      }
    }
  }

  static configurationItems () {
    return {}
  }

  static serviceDescription () {
    return 'This service provides a lightbulb where u can set level and color'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticRGBAccessory
