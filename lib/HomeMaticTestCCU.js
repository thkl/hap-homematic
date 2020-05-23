/*
 * File: HomeMaticTestCCU.js
 * Project: hap-homematic
 * File Created: Saturday, 25th April 2020 3:07:18 pm
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
const HomeMaticCCU = require(path.join(__dirname, 'HomeMaticCCU.js'))

class HomeMaticTestCCU extends HomeMaticCCU {
  constructor (log, configuration) {
    super(log, configuration)
    this.log = log
    this.dummyValues = {}
    this.dummyVariables = {}
  }

  init () {
  }

  setDummyDevices (devices) {
    let self = this
    this.devices = devices
    // loop thru devices and add the interfaces used
    this.devices.map(device => {
      let ifNum = device.intf
      if (!self.interfaces[ifNum]) {
        self.interfaces[ifNum] = {
          inUse: false,
          name: device.intfName
        }
      }
    })
  }

  setDummyValues (values) {
    this.dummyValues = values
  }

  connect () {
    this.eventCallbacks = {}
  }

  hazDatapoint (dpObject) {
    let self = this
    let adr = dpObject.intf + '.' + dpObject.serial + ':' + dpObject.channelId + '.' + dpObject.dpName
    return new Promise((resolve, reject) => {
      let dphere = self.dummyValues[adr] !== undefined
      self.log.debug('[TestCCU] hazDataPoint %s %s', adr, dphere)
      resolve(dphere)
    })
  }

  setValue (address, newValue) {
    let self = this
    return new Promise((resolve, reject) => {
      self.dummyValues[address] = newValue
      resolve()
    })
  }

  getValue (address, ignoreCache = false) {
    let self = this
    return new Promise((resolve, reject) => {
      resolve(self.dummyValues[address])
    })
  }

  fireEvent (address, value) {
    this.log.debug('[TestCCU] fireEvent for %s with value %s', address, value)
    this.dummyValues[address] = value
    super.fireEvent(address, value)
  }

  setVariable (varName, newValue) {
    let self = this
    return new Promise((resolve, reject) => {
      self.dummyVariables[varName] = newValue
      resolve()
    })
  }

  getVariableValue (varName) {
    let self = this
    return new Promise((resolve, reject) => {
      resolve(self.dummyVariables[varName])
    })
  }
}

module.exports = HomeMaticTestCCU
