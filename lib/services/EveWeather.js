/*
 * File: EveWeather.js
 * Project: hap-homematic
 * File Created: Saturday, 20th June 2020 6:19:54 pm
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

'use strict'

const CustomHomeKitTypes = require('./CustomHomeKitTypes.js')

let hap

module.exports = class EveHomeKitWeatherTypes extends CustomHomeKitTypes {
  constructor (globalHap) {
    super(globalHap)
    hap = globalHap

    this.createCharacteristic('AirPressure', 'E863F10F-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT8,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('RainDay', 'ccc04890-565b-4376-b39a-3113341d9e0f', {
      format: hap.Characteristic.Formats.FLOAT,
      unit: 'mm',
      maxValue: 500,
      minValue: 0,
      minStep: 0.1,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('RainBool', 'f14eb1ad-e000-4ef4-a54f-0cf07b2e7be7', {
      format: hap.Characteristic.Formats.BOOL,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('WindSpeed', '49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41', {
      format: hap.Characteristic.Formats.UINT8,
      unit: 'm/s',
      maxValue: 100,
      minValue: 0,
      minStep: 0.1,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('WindDirection', '46f1284c-1912-421b-82f5-eb75008b167e', {
      format: hap.Characteristic.Formats.STRING,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('SunShineDuration', 'C411F13A-863A-488B-8F62-CA574F702539', {
      format: hap.Characteristic.Formats.FLOAT,
      unit: 'hour',
      minStep: 0.1,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('Windrange', '48B3DCC6-898C-48B9-BFF8-901A6F122767', {
      format: hap.Characteristic.Formats.INTEGER,
      unit: hap.Characteristic.Units.ARC_DEGREE,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createService('EveWeather', 'E863F001-079E-48FF-8F27-9C2605A29F52', [
      hap.Characteristic.CurrentTemperature,
      hap.Characteristic.CurrentRelativeHumidity,
      hap.Characteristic.CurrentAmbientLightLevel,
      this.Characteristic.AirPressure,
      this.Characteristic.RainDay,
      this.Characteristic.RainBool,
      this.Characteristic.WindDirection,
      this.Characteristic.WindSpeed,
      this.Characteristic.SunShineDuration,
      this.Characteristic.Windrange
    ])
  }
}
