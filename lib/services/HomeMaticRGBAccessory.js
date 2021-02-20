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
    this.colorCharacteristic = this.lightBulbService.getCharacteristic(Characteristic.Hue)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('color', null, false)
        let hsv = await self.homeMaticToHSV(value)
        self.hue = hsv.h
        self.sat = hsv.s
        self.level = hsv.v
        self.debugLog('get color %s HUE %s', value, hsv.h)
        if (callback) callback(null, hsv.h)
      })

      .on('set', (value, callback) => {
        self.hue = parseInt(value)
        if (self.sat) {
          let hmColor = self.HSVtoHomeMatic({h: self.hue, s: self.sat, v: self.level || 255})
          self.debugLog('Color %s set Hue to %s', value, hmColor)
          self.setValueForDataPointNameWithSettingsKey('color', null, hmColor)
        }
        callback()
      })

    this.colorCharacteristic.eventEnabled = true

    this.saturationCharacteristic = this.lightBulbService.getCharacteristic(Characteristic.Saturation)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('color', null, false)
        let hsv = self.homeMaticToHSV(value)
        self.hue = hsv.h
        self.sat = hsv.s
        self.level = hsv.v
        if (callback) {
          callback(null, hsv.s)
        }
      })

      .on('set', (value, callback) => {
        self.sat = value
        if (self.hue) {
          let hmColor = self.HSVtoHomeMatic({h: self.hue, s: self.sat, v: self.level || 255})
          self.setValueForDataPointNameWithSettingsKey('color', null, hmColor)
        }
        callback()
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('color', null, async (newValue) => {
      self.debugLog('event on color %s', newValue)
      let hsv = await self.homeMaticToHSV(newValue)
      self.hue = hsv[0]
      self.sat = hsv[1]
      self.debugLog('processed color %s HSV %s', newValue, JSON.stringify(hsv))
      self.updateCharacteristic(self.colorCharacteristic, hsv[0])
      self.updateCharacteristic(self.saturationCharacteristic, hsv[1])
      let level = await self.getLevel()
      self.updateCharacteristic(self.brightnessCharacteristic, (level * 100))
      self.updateCharacteristic(self.isOnCharacteristic, (level > 0))
    })
  }

  homeMaticToHSV (newValue) {
    let self = this
    return new Promise(async (resolve, reject) => {
      let settings = self.deviceServiceSettings('color', null)
      let mode = settings['mode'] || 'HM'
      if (mode === 'RGB') {
        let result = newValue.match(/(\s*[0-9]{1,3}),(\s*[0-9]{1,3}),(\s*[0-9]{1,3})/)
        let r = parseInt(result[1].trim())
        let g = parseInt(result[2].trim())
        let b = parseInt(result[3].trim())
        self.debugLog('RGB is %s,%s,%s', r, g, b)
        let hsv = self.RGBtoHSV([r, g, b])
        self.debugLog('HSV is %s', JSON.stringify(hsv))
        resolve(hsv)
      } else {
      // the HomeMatic Value
        if (newValue === 200) {
          resolve([0, 1, 0])
        } else {
          resolve([Math.round((newValue / 199) * 360), 100, 0])
        }
      }
    })
  }

  HSVtoHomeMatic (hsv) {
    let settings = this.deviceServiceSettings('color', null)
    let mode = settings['mode'] || 'HM'
    if (mode === 'RGB') {
      this.debugLog('HSV is %s', JSON.stringify(hsv))
      let rgb = this.HSVtoRGB([hsv.h, hsv.s, hsv.v])
      this.debugLog('RGB is %s', JSON.stringify(rgb))
      if (rgb) {
        return 'rgb(' + Math.floor(rgb[0]) + ',' + Math.floor(rgb[1]) + ',' + Math.floor(rgb[2]) + ')'
      } else {
        return 'rgb(0,0,0)'
      }
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

  RGBtoHSV (rgb) {
    let rdif
    let gdif
    let bdif
    let h
    let s

    const r = rgb[0] / 255
    const g = rgb[1] / 255
    const b = rgb[2] / 255
    const v = Math.max(r, g, b)
    const diff = v - Math.min(r, g, b)
    const diffc = function (c) {
      return (v - c) / 6 / diff + 1 / 2
    }

    if (diff === 0) {
      h = 0
      s = 0
    } else {
      s = diff / v
      rdif = diffc(r)
      gdif = diffc(g)
      bdif = diffc(b)

      if (r === v) {
        h = bdif - gdif
      } else if (g === v) {
        h = (1 / 3) + rdif - bdif
      } else if (b === v) {
        h = (2 / 3) + gdif - rdif
      }

      if (h < 0) {
        h += 1
      } else if (h > 1) {
        h -= 1
      }
    }

    return [
      h * 360,
      s * 100,
      v * 100
    ]
  }

  HSVtoRGB (hsv) {
    const h = hsv[0] / 60
    const s = hsv[1] / 100
    let v = hsv[2] / 100
    const hi = Math.floor(h) % 6

    const f = h - Math.floor(h)
    const p = 255 * v * (1 - s)
    const q = 255 * v * (1 - (s * f))
    const t = 255 * v * (1 - (s * (1 - f)))
    v *= 255

    switch (hi) {
      case 0:
        return [v, t, p]
      case 1:
        return [q, v, p]
      case 2:
        return [p, v, t]
      case 3:
        return [p, q, v]
      case 4:
        return [t, p, v]
      case 5:
        return [v, p, q]
    }
  }

  static channelTypes () {
    return ['RGBW_COLOR', 'VIR-LG_RGB-DIM-CH']
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
