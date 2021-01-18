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
        let hsv = self.homeMaticToHSV(value)
        self.hue = hsv.h
        self.sat = hsv.s
        self.debugLog('get color %s HUE %s', value, hsv.h)
        if (callback) callback(null, hsv.h)
      })

      .on('set', (value, callback) => {
        self.hue = parseInt(value)
        let hmColor = self.HSVtoHomeMatic({h: self.hue, s: self.sat, v: 255})
        self.debugLog('Color %s set Hue to %s', value, hmColor)
        self.setValueForDataPointNameWithSettingsKey('color', null, hmColor)
        callback()
      })

    this.color.eventEnabled = true

    this.csat = this.lightBulbService.getCharacteristic(Characteristic.Saturation)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('color', null, false)
        let hsv = self.homeMaticToHSV(value)
        self.hue = hsv.h
        self.sat = hsv.s
        if (callback) {
          callback(null, hsv.s)
        }
      })

      .on('set', (value, callback) => {
        self.sat = value
        let hmColor = self.HSVtoHomeMatic({h: self.hue, s: self.sat, v: 0})
        self.setValueForDataPointNameWithSettingsKey('color', null, hmColor)
        callback()
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('color', null, (newValue) => {
      let hsv = self.homeMaticToHSV(newValue)
      self.hue = hsv.h
      self.sat = hsv.s
      self.debugLog('event color %s HUE %s', newValue, hsv.h)
      self.updateCharacteristic(self.color, hsv.h)
      self.updateCharacteristic(self.csat, hsv.s)
    })
  }

  homeMaticToHSV (newValue) {
    let settings = this.deviceServiceSettings('color', null)
    let mode = settings['mode'] || 'HM'
    if (mode === 'RGB') {
      let result = newValue.match(/(\s*[0-9]{1,3}),(\s*[0-9]{1,3}),(\s*[0-9]{1,3})/)
      let r = parseInt(result[1].trim())
      let g = parseInt(result[2].trim())
      let b = parseInt(result[3].trim())
      let hsv = this.RGBtoHSV(r, g, b)
      return hsv
    } else {
      // the HomeMatic Value
      if (newValue === 200) {
        return {h: 0, s: 1, v: 0}
      } else {
        return {h: Math.round((newValue / 199) * 360), s: 100, v: 0}
      }
    }
  }

  HSVtoHomeMatic (hsv) {
    let settings = this.deviceServiceSettings('color', null)
    let mode = settings['mode'] || 'HM'
    if (mode === 'RGB') {
      let rgb = this.HSVtoRGB(hsv.h, hsv.s, hsv.v)
      return rgb.r + ',' + rgb.g + ',' + rgb.b
    } else {
      let hmColor
      if (hsv.s < 10) {
        hmColor = 200
      } else {
        hmColor = Math.round((hsv.h / 360) * 199)
      }
      return hmColor
    }
  }

  RGBtoHSV (r, g, b) {
    let max = Math.max(r, g, b)
    let min = Math.min(r, g, b)
    let d = max - min
    let h
    let s = (max === 0 ? 0 : d / max)
    let v = max / 255

    switch (max) {
      case min:
        h = 0
        break
      case r:
        h = (g - b) + d * (g < b ? 6 : 0)
        h /= 6 * d
        break
      case g:
        h = (b - r) + d * 2
        h /= 6 * d
        break
      case b:
        h = (r - g) + d * 4
        h /= 6 * d
        break
    }

    h = h * 360
    s = s * 100
    v = v * 100

    return {
      h: h,
      s: s,
      v: v
    }
  }

  HSVtoRGB (h, s, v) {
    var r, g, b, i, f, p, q, t
    i = Math.floor(h * 6)
    f = h * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)
    switch (i % 6) {
      case 0:
        r = v
        g = t
        b = p
        break
      case 1:
        r = q
        g = v
        b = p
        break
      case 2:
        r = p
        g = v
        b = t
        break
      case 3:
        r = p
        g = q
        b = v
        break
      case 4:
        r = t
        g = p
        b = v
        break
      case 5:
        r = v
        g = p
        b = q
        break
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
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
      },
      'VIR-LG_RGB-DIM-CH': {
        level: {name: '1.LEVEL'},
        working: {name: '1.WORKING'},
        color: {name: '1.RGB', mode: 'RGB'}

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
