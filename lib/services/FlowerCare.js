/*
 * File: EveThermo.js
 * Project: hap-homematic
 * File Created: Saturday, 23rd May 2020 9:51:06 pm
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

module.exports = class EveHomeKitFertilityTypes extends CustomHomeKitTypes {
  constructor (globalHap) {
    super(globalHap)
    hap = globalHap
    this.createCharacteristic('SoilFertility', '0029260E-B09C-4FD7-9E60-2C60F1250618', {
      format: hap.Characteristic.Formats.UINT8,
      unit: 'dS/m',
      maxValue: 10000,
      minValue: 0,
      minStep: 1,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    }, 'Soil Fertility')

    this.createCharacteristic('FertilityAlarm', '0029270E-B09C-4FD7-9E60-2C60F1250618', {
      format: hap.Characteristic.Formats.BOOL,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    }, 'Fertility Alarm')

    this.createCharacteristic('MoistureAlarm', '0029280E-B09C-4FD7-9E60-2C60F1250618', {
      format: hap.Characteristic.Formats.BOOL,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    }, 'Moisture Alarm')
  }
}
