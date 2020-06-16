/*
 * File: HomeMaticFloorHeatingActuatorAccessory.js
 * Project: hap-homematic
 * File Created: Tuesday, 16th June 2020 8:08:42 pm
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
const EveHomeKitValveTypes = require(path.join(__dirname, 'EveValve.js'))

class HomeMaticFloorHeatingActuatorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let eveValve = new EveHomeKitValveTypes(this.gatoHomeBridge.hap)
    let service = this.getService(eveValve.ValveService)
    let valveCharacteristic = service.getCharacteristic(Characteristic.CurrentValveState)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('ValveState', null, false)
        let fValue = parseFloat(value)
        if (callback) callback(null, (fValue * 100))
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('ValveState', null, (newValue) => {
      let fValue = parseFloat(newValue)
      self.updateCharacteristic(valveCharacteristic, (fValue * 100))
    })
  }

  static channelTypes () {
    return ['CLIMATECONTROL_FLOOR_TRANSCEIVER']
  }

  initServiceSettings () {
    return {
      '*': {
        ValveState: {name: 'VALVE_STATE'}
      }
    }
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticFloorHeatingActuatorAccessory
