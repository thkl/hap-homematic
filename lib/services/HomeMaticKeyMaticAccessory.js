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
          if (callback) callback(null, self.isTrue(value) ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED)
        })
      })
      .on('set', (value, callback) => {
        callback()
      })

    this.lockCurrentState.eventEnabled = true

    this.lockTargetState = service.getCharacteristic(Characteristic.LockTargetState)
      .on('get', (callback) => {
        self.getValue('STATE', true).then((value) => {
          if (callback) callback(null, self.isTrue(value) ? Characteristic.LockTargetState.UNSECURED : Characteristic.LockTargetState.SECURED)
        })
      })

      .on('set', (value, callback) => {
        // check config settings what to do
        if (value === 1) {
          if (unlockMode === 'open') {
            self.setValue('OPEN', true)
          } else {
            self.setValue('STATE', 0)
          }
        } else {
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
          self.setValue('OPEN', true).then(() => {})
          self.openTimer = setTimeout(() => {
            dopener.setValue(1, null)
          }, 2000)
        }
        callback()
      })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
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
