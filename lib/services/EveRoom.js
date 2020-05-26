/*
 * File: EveRoom.js
 * Project: hap-homematic
 * File Created: Tuesday, 26th May 2020 9:36:32 pm
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

const CustomHomeKitTypes = require('./CustomHomeKitTypes.js')

let hap

module.exports = class EveHomeKitRoomTypes extends CustomHomeKitTypes {
  constructor (homebridge) {
    super(homebridge)
    hap = homebridge.homebridge.hap
    console.log('Createing room characteristics')

    this.createCharacteristic('AQX1', 'E863F10B-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT16,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.HIDDEN]
    })

    this.createCharacteristic('AQX2', 'E863F132-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.DATA,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.HIDDEN]
    })
  }
}
