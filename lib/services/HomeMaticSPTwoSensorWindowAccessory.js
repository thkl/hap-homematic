/*
 * File: HomeMaticSPTwoSensorWindowAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 6th December 2020 11:07:15 am
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

class HomeMaticSPTwoSensorWindowAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    this.service = this.getService(Service.Window)
    this.enableLoggingService('door', false)
    this.tampered = false
    this.timesOpened = (this.getPersistentValue('timesOpened', 0))
    this.timeOpen = this.getPersistentValue('timeOpen', 0)
    this.timeClosed = this.getPersistentValue('timeClosed', 0)
    let settings = this.getDeviceSettings()
    this.address_rotarysensor = settings.address_rotarysensor
    this.address_windowsensor = settings.address_windowsensor

    // enable the last Opened Service
    this.addLastActivationService(this.service)

    this.addResetStatistics(this.service, () => {
      self.log.debug('[Door] reset Stats')
      if (self.tOC !== undefined) {
        self.timesOpened = 0
        self.savePersistentValue('timesOpened', self.timesOpened)
        self.tOC.updateValue(self.timesOpened, null)
      }
    })

    this.tOC = this.addStateBasedCharacteristic(this.service, this.eve.Characteristic.TimesOpened, () => {
      return self.timesOpened
    })

    this.oDC = this.addStateBasedCharacteristic(this.service, this.eve.Characteristic.OpenDuration, () => {
      return self.timeOpen
    })

    this.cDC = this.addStateBasedCharacteristic(this.service, this.eve.Characteristic.ClosedDuration, () => {
      return self.timeClosed
    })

    this.currentPosition = this.service.getCharacteristic(Characteristic.CurrentPosition)
      .on('get', (callback) => {
        self.updateValues()
        callback(null, self.processPositionState())
      })

    this.targetPosition = this.service.getCharacteristic(Characteristic.TargetPosition)
      .on('get', (callback) => {
        self.updateValues()
        callback(null, self.processPositionState())
      })
      .on('set', (value, callback) => {
        setTimeout(() => {
        }, 500)
        if (callback) {
          callback()
        }
      })

    this.positionState = this.service.getCharacteristic(Characteristic.PositionState)
    this.positionState.on('get', (callback) => {
      if (callback) callback(null, Characteristic.PositionState.STOPPED)
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_rotarysensor), (newValue) => {
      self.rotaryState = newValue
      let newState = self.processPositionState()
      self.updateCharacteristic(self.currentPosition, newState)
      self.updateCharacteristic(self.targetPosition, newState)
      self.updateCharacteristic(self.positionState, Characteristic.PositionState.STOPPED)
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_windowsensor), (newValue) => {
      self.windowState = newValue
      let newState = self.processPositionState()
      self.updateCharacteristic(self.currentPosition, newState)
      self.updateCharacteristic(self.targetPosition, newState)
      self.updateCharacteristic(self.positionState, Characteristic.PositionState.STOPPED)
    })

    this.service.addOptionalCharacteristic(Characteristic.StatusTampered)

    this.tamperedCharacteristic = this.service.getCharacteristic(Characteristic.StatusTampered)
      .on('get', (callback) => {
        callback(null, self.tampered)
      })
  }

  async updateValues () {
    this.rotaryState = await await this.getValue(this.address_rotarysensor, true)
    this.windowState = await await this.getValue(this.address_windowsensor, true)
  }

  processPositionState () {
    let self = this
    let matrix = [
      {result: 0, rotary: 0, window: false},
      {result: -1, rotary: 0, window: true},
      {result: 10, rotary: 1, window: false},
      {result: 25, rotary: 1, window: true},
      {result: 10, rotary: 2, window: false},
      {result: 100, rotary: 2, window: true}
    ]
    this.debugLog('Sensor States are RS :%s WS: %s', this.rotaryState, this.windowState)
    let result = matrix.filter((el) => {
      return ((self.didMatch(self.rotaryState, el.rotary)) && (self.didMatch(self.windowState, el.window)))
    })

    this.debugLog('Matrix result is %s', JSON.stringify(result))

    if (result.length > 0) {
      let state = result[0]
      if (state.result === -1) {
        self.tampered = true
        self.updateCharacteristic(self.tamperedCharacteristic, true)
        return 100
      } else {
        self.tampered = false
        self.updateCharacteristic(self.tamperedCharacteristic, false)
        return state.result
      }
    }
  }

  static validate (configurationItem) {
    return false
  }

  shutdown () {
    clearTimeout(this.refreshTimer)
    super.shutdown()
  }

  static channelTypes () {
    return ['SPECIAL']
  }

  static serviceDescription () {
    return 'This service provides a window accessory combined from a rotary sensor and a normal window contact'
  }

  static configurationItems () {
    return {
      'address_rotarysensor': {
        type: 'text',
        label: 'Address retary sensor',
        selector: 'datapoint',
        options: {filterChannels: ['ROTARY_HANDLE_SENSOR', 'ROTARY_HANDLE_TRANSCEIVER']},
        hint: '',
        mandatory: true
      },
      'address_windowsensor': {
        type: 'text',
        label: 'Address window sensor',
        selector: 'datapoint',
        options: {filterChannels: ['CONTACT', 'SHUTTER_CONTACT', 'MULTI_MODE_INPUT_TRANSMITTER']},
        hint: '',
        mandatory: true
      }
    }
  }
}

module.exports = HomeMaticSPTwoSensorWindowAccessory
