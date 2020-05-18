/*
 * File: CustomHomeKitTypes.js
 * Project: hap-homematic
 * File Created: Sunday, 8th March 2020 3:50:10 pm
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

var util = require('util')

let hap

module.exports = class CustomHomeKitTypes {
  constructor (homebridge) {
    hap = homebridge.homebridge.hap
    this.Characteristic = {}
    this.Service = {}
  }

  createCharacteristic (name, uuid, props, displayName = name) {
    this.Characteristic[name] = function () {
      hap.Characteristic.call(this, displayName, uuid)
      this.setProps(props)
      this.value = this.getDefaultValue()
    }
    util.inherits(this.Characteristic[name], hap.Characteristic)
    this.Characteristic[name].UUID = uuid
  }

  createService (name, uuid, Characteristics, OptionalCharacteristics = []) {
    this.Service[name] = function (displayName, subtype) {
      hap.Service.call(this, displayName, uuid, subtype)
      for (const Characteristic of Characteristics) {
        this.addCharacteristic(Characteristic)
      }
      for (const Characteristic of OptionalCharacteristics) {
        this.addOptionalCharacteristic(Characteristic)
      }
    }
    util.inherits(this.Service[name], hap.Service)
    this.Service[name].UUID = uuid
  }
}
