/*
 * File: HomeMaticProgramAccessory.js
 * Project: hap-homematic
 * File Created: Tuesday, 24th March 2020 6:33:39 pm
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
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticProgramAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    var service = this.getService(Service.Switch)
    this.isOnCharacteristic = service.getCharacteristic(Characteristic.On)

    this.isOnCharacteristic.on('get', (callback) => {
      callback(null, false)
    })

    this.isOnCharacteristic.on('set', (value, callback) => {
      if (value === true) {
        self._ccu.runProgram(self.nameInCCU).then((result) => {
          self.isOnCharacteristic.updateValue(false, null)
        })
      }
      callback()
    })
  }

  static channelTypes () {
    return ['PROGRAMM']
  }

  static configurationItems () {
    return {
    }
  }

  static serviceDescription () {
    return 'This service provides a switch where u can start a program from'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticProgramAccessory
