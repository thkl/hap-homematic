/*
 * File: HomeMaticKeyMaticAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 28th March 2020 4:56:55 pm
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

class HomeMaticKeyMaticAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.LockMechanism(this._name))
    let unlockMode = this.getDeviceSettings().unlockMode || 'unlock'

    this.lockCurrentState = service.getCharacteristic(Characteristic.LockCurrentState)
      .on('get', (callback) => {
        self.getValue('STATE', true).then((value) => {
          self.debugLog('hk get lockCurrentState result from ccu is %s', value)
          if (callback) callback(null, self.isTrue(value) ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED)
        })
      })
      .on('set', (value, callback) => {
        self.debugLog('hk set lockCurrentState will be ignored')
        callback()
      })

    this.lockCurrentState.eventEnabled = true

    this.lockTargetState = service.getCharacteristic(Characteristic.LockTargetState)
      .on('get', (callback) => {
        self.getValue('STATE', true).then((value) => {
          self.debugLog('hk get lockTargetState result from ccu is %s', value)
          if (callback) callback(null, self.isTrue(value) ? Characteristic.LockTargetState.UNSECURED : Characteristic.LockTargetState.SECURED)
        })
      })

      .on('set', (value, callback) => {
        // check config settings what to do
        self.debugLog('hk set lockTargetState value is %s', value)
        if (value === 1) {
          self.debugLog('unlock command')
          if (unlockMode === 'open') {
            self.debugLog('unlock mode is open send open command to ccu')
            self.setValue('OPEN', true)
          } else {
            self.debugLog('unlock mode is normal send state 0 command to ccu')
            self.setValue('STATE', 0)
          }
        } else {
          self.debugLog('lock command received send state 1 to ccu')
          self.setValue('STATE', 1)
        }
        // set the current state to the desired new state to satisfy siri
        self.lockCurrentState.updateValue((value === 1) ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED, null)
        callback()
      })

    let dopener = service.addCharacteristic(Characteristic.TargetDoorState)
      .on('get', (callback) => {
        if (callback) callback(null, 1)
      })

      .on('set', (value, callback) => {
        if (value === 0) {
          self.debugLog('hk set dopener TargetDoorState value 0 will send OPEN command to ccu')
          self.setValue('OPEN', true).then(() => {})
          self.openTimer = setTimeout(() => {
            self.debugLog('reset TargetDoorState')
            dopener.setValue(1, null)
          }, 2000)
        }
        callback()
      })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      self.debugLog('event for STATE with value %s will update lockCurrentState and lockTargetState', newValue)
      self.lockCurrentState.updateValue(self.isTrue(newValue) ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED, null)
      self.lockTargetState.updateValue(self.isTrue(newValue) ? Characteristic.LockTargetState.UNSECURED : Characteristic.LockTargetState.SECURED, null)
    })
  }

  queryState () {
    this.getValue('STATE', true) // should trigger the registered events
  }

  shutdown () {
    clearTimeout(this.openTimer)
    clearTimeout(this.requeryTimer)
    super.shutdown()
  }

  static channelTypes () {
    return ['KEYMATIC']
  }

  static serviceDescription () {
    return 'This service provides a locking system in HomeKit connected to your Keymatic'
  }

  static configurationItems () {
    return {
      'unlockMode': {
        type: 'option',
        array: ['unlock', 'open'],
        default: 'unlock',
        label: 'Unlock mode',
        hint: 'What to do when HomeKit will unlock the door'
      }
    }
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticKeyMaticAccessory
