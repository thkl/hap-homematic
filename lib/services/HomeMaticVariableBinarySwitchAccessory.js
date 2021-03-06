/*
 * File: HomeMaticVariableBinarySwitchAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 6th March 2021 5:08:26 pm
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

module.exports = class HomeMaticVariableBinarySwitchAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    if ((this.variable.valuetype === 2) && (this.variable.subtype === 2)) {
      let subType = this.getDeviceSettings().Type || 'Lightbulb'
      let onTime = this.getDeviceSettings().OnTime
      let service
      let readOnly = this.isReadOnly()
      let valveType
      this.log.debug('isReadonly %s', readOnly)
      switch (subType) {
        case 'Outlet':
          service = this.getService(Service.Outlet)
          break
        case 'Switch':
          service = this.getService(Service.Switch)
          break
        case 'Fan':
          service = this.getService(Service.Fan)
          break
        case 'Valve - Irrigation':
          service = this.getService(Service.Valve)
          valveType = Characteristic.ValveType.IRRIGATION
          break

        case 'Valve - Shower head':
          service = this.getService(Service.Valve)
          valveType = Characteristic.ValveType.SHOWER_HEAD
          break

        case 'Valve - Water faucet':
          service = this.getService(Service.Valve)
          valveType = Characteristic.ValveType.WATER_FAUCET
          break

        case 'Valve - Generic':
          service = this.getService(Service.Valve)
          valveType = Characteristic.ValveType.GENERIC_VALVE
          break

        default:
          service = this.getService(Service.Lightbulb)
          break
      }

      this.debugLog('creating Service %s', subType)

      let isOnCharacteristic
      let isInUseCharacteristic

      if (valveType) {
        service.getCharacteristic(Characteristic.IsConfigured)
          .on('get', (callback) => {
            callback(null, Characteristic.IsConfigured.CONFIGURED)
          })
        isOnCharacteristic = service.getCharacteristic(Characteristic.Active)
        isInUseCharacteristic = service.getCharacteristic(Characteristic.InUse)
        self.isInUse = 0
      } else {
        isOnCharacteristic = service.getCharacteristic(Characteristic.On)
        self.isInUse = 0
      }

      isOnCharacteristic.on('get', (callback) => {
        self._ccu.getVariableValue(self._serial).then((newValue) => {
          let result = self.isTrue(newValue) ? 1 : 0
          self.debugLog('getActive %s', result)
          callback(null, result)
        })
      })

        .on('set', (value, callback) => {
          self._ccu.setVariable(self._serial, self.isTrue(value)).then((result) => {
            if ((self.isTrue(value)) && (onTime) && (parseInt(onTime) > 0)) {
              setTimeout(() => { // reset the variable
                self._ccu.setVariable(self._serial, false)
              }, onTime * 1000)
            }
            self.isInUse = self.isTrue(value) ? 1 : 0
            if (isInUseCharacteristic) {
              setTimeout(() => {
                isInUseCharacteristic.updateValue(self.isInUse, null)
              }, 500)
            }
          })
          callback()
        })

      isOnCharacteristic.eventEnabled = true

      if (isInUseCharacteristic !== undefined) {
        self.debugLog('InUse is here so setup')

        isInUseCharacteristic.on('get', (callback) => {
          self.debugLog('getInUse %s', self.isInUse)
          callback(null, self.isInUse || 0)
        })

        isInUseCharacteristic.eventEnabled = true
      }

      this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.nameInCCU), (newValue) => {
        self.isInUse = self.isTrue(newValue) ? 1 : 0
        self.debugLog('Update isOn/isActive to %s', self.isInUse)
        isOnCharacteristic.updateValue(self.isInUse, null)
        if (isInUseCharacteristic !== undefined) {
          setTimeout(() => {
            self.debugLog('Update InUse to %s', self.isInUse)
            isInUseCharacteristic.updateValue(self.isInUse, null)
          }, 500)
        }
      })
    }
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a sensor with value from variables'
  }

  static configurationItems () {
    return {
      'Type': {
        type: 'option',
        array: ['Lightbulb', 'Outlet', 'Switch', 'Fan', 'Valve - Irrigation', 'Valve - Shower head', 'Valve - Water faucet', 'Valve - Generic'],
        default: 'Lightbulb',
        label: 'Subtype of this device',
        hint: 'A switch can have different sub types'
      },
      'OnTime': {
        type: 'number',
        default: 0,
        label: 'On Time',
        hint: 'HAP will switch off this device automatically after the given seconds. Set this to 0 to turn off this feature.'
      }
    }
  }
  static validate (configurationItem) {
    return false
  }
}
