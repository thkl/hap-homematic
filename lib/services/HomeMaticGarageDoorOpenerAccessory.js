/*
 * File: HomeMaticGarageDoorOpenerAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 28th March 2020 11:08:32 am
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
const moment = require('moment')

class HomeMaticGarageDoorOpenerAccessory extends HomeMaticAccessory {
  publishServices(Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.GarageDoorOpener(this._name))
    let settings = this.getDeviceSettings()
    let ventilation = settings.addventilation || false
    // this is for eve history
    this.timesOpened = (this.getPersistentValue('timesOpened', 0))
    this.timeOpen = this.getPersistentValue('timeOpen', 0)
    this.timeClosed = this.getPersistentValue('timeClosed', 0)
    this.initialQuery = true
    this.hkTrigger = false
    this.lastProcess = 0 // asume the gate is stable while initializing
    let obstacle = service.getCharacteristic(Characteristic.ObstructionDetected)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })

    obstacle.eventEnabled = true

    this.currentDoorState = service.getCharacteristic(Characteristic.CurrentDoorState)
      .on('get', (callback) => {
        self.getValue('DOOR_STATE', true).then((value) => {
          self.debugLog('ccu says door is %s', value)
          self.doorState = parseInt(value)
          switch (parseInt(value)) {
            case 0:
              if (callback) callback(null, Characteristic.CurrentDoorState.CLOSED)
              break
            case 1:
            case 2:
            case 3:
              if (callback) callback(null, Characteristic.CurrentDoorState.OPEN)
              break
            default:
              break
          }
        })
      })
      .on('set', (value, callback) => {
        callback()
      })
    this.currentDoorState.eventEnabled = true

    this.targetDoorState = service.getCharacteristic(Characteristic.TargetDoorState)
      .on('set', (value, callback) => {
        self.debugLog('Homekit Door Command %s; also set internal working to true', value)
        self.working = true
        self.hkTrigger = true
        switch (value) {
          case Characteristic.TargetDoorState.OPEN:
            self.debugLog('sent 1 to ccu ')
            self.setValue('DOOR_COMMAND', 1)
            break
          case Characteristic.TargetDoorState.CLOSED:
            self.debugLog('sent 3 to ccu ')
            self.setValue('DOOR_COMMAND', 3)
            break

          default:
            break
        }
        if (callback) {
          callback()
        }
      })
      .on('get', (callback) => {
        self.getValue('DOOR_STATE', true).then((value) => {
          self.debugLog('ccu says door is %s', value)
          self.doorState = parseInt(value)
          switch (parseInt(value)) {
            case 0:
              if (callback) callback(null, Characteristic.TargetDoorState.CLOSED)
              break
            case 1:
            case 2:
            case 3:
              if (callback) callback(null, Characteristic.TargetDoorState.OPEN)
              break
            default:
              break
          }
          self.updateCharacteristic(self.ventOnCharacteristic, (self.doorState === 2))
        })
      })

    this.targetDoorState.eventEnabled = true


    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('DOOR_STATE'), (newValue) => {
      var isOpen = false
      self.doorState = parseInt(newValue)
      switch (parseInt(newValue)) {
        case 0:
          if (self.hkTrigger === false) {
            self.debugLog('send TargetDoorState.CLOSED to Homekit')
            self.targetDoorState.updateValue(Characteristic.TargetDoorState.CLOSED, null)
          }
          self.curDoorState = Characteristic.CurrentDoorState.CLOSED
          if (self.working === false) {
            setTimeout(() => {
              self.debugLog('working status is false send CurrentDoorState.CLOSED')
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.CLOSED)
              self.updateCharacteristic(self.ventOnCharacteristic, false)
            }, 100)
          }
          break
        case 1:
        case 2:
        case 3:
          if (self.hkTrigger === false) {
            self.debugLog('send TargetDoorState.OPEN to Homekit')
            self.targetDoorState.updateValue(Characteristic.TargetDoorState.OPEN, null)
          }
          self.curDoorState = Characteristic.CurrentDoorState.OPEN
          if (self.working === false) {
            setTimeout(() => {
              self.debugLog('working status is false send CurrentDoorState.OPEN')
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.OPEN)
              self.updateCharacteristic(self.ventOnCharacteristic, (self.doorState === 2))
            }, 100)
          }
          isOpen = true
          break

        default:
          break
      }
      // this is eve History
      if ((self.initialQuery === false) && (self.lastValue !== isOpen)) {
        let now = moment().unix()
        if (isOpen === true) {
          self.timeClosed = self.timeClosed + (moment().unix() - self.timeStamp)
          self.timesOpened = self.timesOpened + 1
          self.tOC.updateValue(self.timesOpened, null)
          self.savePersistentValue('timesOpened', self.timesOpened)
          self.updateLastActivation()
          self.timeStamp = now
          self.oDC.updateValue(self.timeOpen)
        } else {
          self.timeOpen = self.timeOpen + (moment().unix() - self.timeStamp)
          self.cDC.updateValue(self.timeClosed)
        }
      }

      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PROCESS'), (newValue) => {
        let process = self.isTrue(newValue)
        if (process !== self.lastProcess) {
          self.working = process
        } else {
          self.debugLog('Process didnt change %s so i will ignore this.', newValue)
        }
        self.lastProcess = process
        if (!self.working) {
          self.hkTrigger = false
          if (self.currentDoorState !== undefined) {
            self.debugLog('working status is false update current door status to %s', self.curDoorState)
            self.updateCharacteristic(self.currentDoorState, self.curDoorState)
            self.updateCharacteristic(self.ventOnCharacteristic, (self.curDoorState === Characteristic.TargetDoorState.CLOSED))
          } else {
            self.debugLog('skip this event because we do not now the current door state')
          }
        }
      })



      self.addLogEntry({
        status: isOpen
      })

      self.initialQuery = false
    })

    if (ventilation === true) {
      self.debugLog('adding ventilation')
      let ventilationSwitch = this.addService(new Service.Switch(this._name + ' Ventilation', 'Ventilation'))
      this.ventOnCharacteristic = ventilationSwitch.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
          if (callback) callback(null, (self.curDoorState === Characteristic.CurrentDoorState.OPEN))
        })
        .on('set', (value, callback) => {
          self.debugLog('HomeKit Vent Position command %s', value)
          if (value === true) {
            self.debugLog('sent 4 to ccu')
            self.setValue('DOOR_COMMAND', 4)
          } else {
            self.debugLog('sent 3 to ccu')
            self.setValue('DOOR_COMMAND', 3)
          }
          if (callback) {
            callback()
          }
        })
    }

    // Enable all Eve Logging Services for this device
    this.enableLoggingService('door', false)

    // enable the last Opened Service
    this.addLastActivationService(service)

    this.addResetStatistics(service, () => {
      self.debugLog('reset Stats')
      if (self.tOC !== undefined) {
        self.timesOpened = 0
        self.savePersistentValue('timesOpened', self.timesOpened)
        self.tOC.updateValue(self.timesOpened, null)
      }
    })

    this.tOC = this.addStateBasedCharacteristic(service, this.eve.Characteristic.TimesOpened, () => {
      return self.timesOpened
    })

    this.oDC = this.addStateBasedCharacteristic(service, this.eve.Characteristic.OpenDuration, () => {
      return self.timeOpen
    })

    this.cDC = this.addStateBasedCharacteristic(service, this.eve.Characteristic.ClosedDuration, () => {
      return self.timeClosed
    })
  }

  static channelTypes() {
    return ['DOOR_RECEIVER']
  }

  static configurationItems() {
    return {
      'addventilation': {
        type: 'checkbox',
        default: false,
        label: 'Add ventilation',
        hint: 'Adds a button to set the gate to ventilation mode'
      }
    }
  }

  static serviceDescription() {
    return 'This service provides a garage door opener in HomeKit'
  }

  static validate(configurationItem) {
    return false
  }
}

module.exports = HomeMaticGarageDoorOpenerAccessory
