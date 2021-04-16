/*
 * File: HomeMaticKeyMaticIPAccessory.js
 * Project: hap-homematic
 * File Created: 14.04.2021 5:49:23 pm
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

module.exports = class HomeMaticKeyMaticIPAccessory extends HomeMaticAccessory {
  publishServices(Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.LockMechanism(this._name))
    let unlockMode = this.getDeviceSettings().unlockMode || 'unlock'

    this.lockCurrentState = service.getCharacteristic(Characteristic.LockCurrentState)
      .on('get', (callback) => {
        self.debugLog('LockCurrentState get called')
        self.getValue('LOCK_STATE', true).then((value) => {
          self.debugLog('hk get lockCurrentState result from ccu is %s', value)
          if (callback) {
            switch (parseInt(value)) {
              case 0:
                callback(null, Characteristic.LockCurrentState.UNSECURED)
                break
              case 1:
                callback(null, Characteristic.LockCurrentState.SECURED)
                break
              case 2:
                callback(null, Characteristic.LockCurrentState.UNSECURED)
                break
              default:
                self.debugLog('unknown LockCurrentState value %s', value)
                callback(null, Characteristic.LockCurrentState.UNSECURED)

            }
          } else {
            self.log.error('No Callback provided')
          }
        })
      })
      .on('set', (value, callback) => {
        self.debugLog('hk set lockCurrentState will be ignored')
        callback()
      })

    this.lockCurrentState.eventEnabled = true

    this.lockTargetState = service.getCharacteristic(Characteristic.LockTargetState)
      .on('get', (callback) => {
        self.debugLog('LockTargetState get called')

        self.getValue('LOCK_TARGET_LEVEL', true).then((value) => {
          self.debugLog('hk get lockTargetState result from ccu is %s', value)

          if (callback) {
            switch (parseInt(value)) {
              case 0:
                callback(null, Characteristic.LockTargetState.SECURED)
                break
              case 1:
              case 2:
                callback(null, Characteristic.LockTargetState.UNSECURED)
                break
              default:
                self.debugLog('unknown LockTargetState value %s', value)
                callback(null, Characteristic.LockTargetState.UNSECURED)
            }
          }
        })
      })

      .on('set', (value, callback) => {
        // check config settings what to do
        self.lockEvents = true // disable events
        self.debugLog('hk set lockTargetState value is %s', value)
        if (value === Characteristic.LockTargetState.UNSECURED) {
          self.debugLog('unlock command')
          if (unlockMode === 'open') {
            self.debugLog('unlock mode is open send open command to ccu')
            self.setValue('LOCK_TARGET_LEVEL', 2)
          } else {
            self.debugLog('unlock mode is normal send state 0 command to ccu')
            self.setValue('LOCK_TARGET_LEVEL', 1)
          }
        } else if (value === Characteristic.LockTargetState.SECURED) {
          self.debugLog('lock command received send state 1 to ccu')
          self.setValue('LOCK_TARGET_LEVEL', 0)
        }

        self.requeryTimer = setTimeout(() => {
          // enable events and query the door again
          self.lockEvents = false
          self.getValue('LOCK_STATE', true)
        }, 15000) // requery the door in about 5 seconds

        callback()
      })

    let dopener = service.addCharacteristic(Characteristic.TargetDoorState)
      .on('get', (callback) => {
        if (callback) callback(null, 1)
      })

      .on('set', (value, callback) => {
        if (value === 0) {
          self.debugLog('hk set dopener TargetDoorState value 0 will send OPEN command to ccu')
          self.setValue('LOCK_TARGET_LEVEL', 2).then(() => { })
          self.openTimer = setTimeout(() => {
            self.debugLog('reset TargetDoorState')
            dopener.setValue(1, null)
          }, 2000)
        }
        callback()
      })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('LOCK_STATE'), (newValue) => {
      if (self.lockEvents === true) {
        self.debugLog('event for LOCK_STATE with value %s but events are locked due to recent homekit command', newValue)
        return
      }
      let lcs
      switch (parseInt(newValue)) {
        case 0:
          lcs = Characteristic.LockCurrentState.UNSECURED
          break
        case 1:
          lcs = Characteristic.LockCurrentState.SECURED
          break
        case 2:
          lcs = Characteristic.LockCurrentState.UNSECURED
          break
      }

      self.debugLog('event for LOCK_STATE with value %s will update lockCurrentState (%s) ', newValue, lcs)
      self.updateCharacteristic(self.lockCurrentState, lcs)
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('LOCK_TARGET_LEVEL'), (newValue) => {
      if (self.lockEvents === true) {
        self.debugLog('event for LOCK_TARGET_LEVEL with value %s but events are locked due to recent homekit command', newValue)
        return
      }
      let lts
      switch (parseInt(newValue)) {
        case 0:
          lts = Characteristic.LockCurrentState.SECURED
          break
        case 1:
        case 2:
          lts = Characteristic.LockCurrentState.UNSECURED
          break
      }

      self.debugLog('event for LOCK_TARGET_LEVEL with value %s will update lockTargetState (%s) ', newValue, lts)
      self.updateCharacteristic(self.lockTargetState, lts)
    })

  }



  queryState() {
    this.getValue('LOCK_STATE', true) // should trigger the registered events
    this.getValue('LOCK_TARGET_LEVEL', true) // should trigger the registered events
  }

  shutdown() {
    clearTimeout(this.openTimer)
    clearTimeout(this.requeryTimer)
    super.shutdown()
  }

  static channelTypes() {
    return ['DOOR_LOCK_STATE_TRANSMITTER']
  }

  static getPriority() {
    return 2
  }

  static serviceDescription() {
    return 'This service provides a locking system in HomeKit connected to your Keymatic'
  }

  static configurationItems() {
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
}
