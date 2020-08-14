/*
 * File: HomeMaticContactSensorAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 9th March 2020 5:18:01 pm
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

class HomeMaticContactSensorAccessory extends HomeMaticAccessory {
  isTrue (value) {
    if (this.reverse === true) {
      return !super.isTrue(value)
    } else {
      return super.isTrue(value)
    }
  }

  publishServices (Service, Characteristic) {
    let self = this

    this.timesOpened = (this.getPersistentValue('timesOpened', 0))
    this.timeOpen = this.getPersistentValue('timeOpen', 0)
    this.timeClosed = this.getPersistentValue('timeClosed', 0)
    let settings = this.getDeviceSettings()
    this.reverse = (settings.reverse !== undefined) ? settings.reverse : false

    this.contact = this.getService(Service.ContactSensor)

    let active = this.contact.getCharacteristic(Characteristic.StatusActive)
      .on('get', (callback) => {
        callback(null, true)
      })
    active.updateValue(true, null)

    // Enable all Eve Logging Services for this device
    this.enableLoggingService('door', false)

    // enable the last Opened Service
    this.addLastActivationService(this.contact)

    this.addResetStatistics(this.contact, () => {
      self.log.debug('[Contact] reset Stats')
      if (self.tOC !== undefined) {
        self.timesOpened = 0
        self.savePersistentValue('timesOpened', self.timesOpened)
        self.tOC.updateValue(self.timesOpened, null)
      }
    })

    this.tOC = this.addStateBasedCharacteristic(this.contact, this.eve.Characteristic.TimesOpened, () => {
      return self.timesOpened
    })

    this.oDC = this.addStateBasedCharacteristic(this.contact, this.eve.Characteristic.OpenDuration, () => {
      return self.timeOpen
    })

    this.cDC = this.addStateBasedCharacteristic(this.contact, this.eve.Characteristic.ClosedDuration, () => {
      return self.timeClosed
    })

    this.state = this.contact.getCharacteristic(Characteristic.ContactSensorState)
      .on('get', async (callback) => {
        // Ask CCU for datepoint value
        let value = await self.getValueForDataPointNameWithSettingsKey('state', null, false)
        // map this with settings
        let mappedValue = self.getDataPointResultMapping('state', null, value)
        if (callback) {
          callback(null, mappedValue)
        }
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', null, (newValue) => {
      let mappedValue = self.getDataPointResultMapping('state', null, newValue)
      let historyValue = self.getDataPointResultMapping('state', null, newValue, 'history')
      self.log.debug('[Contact] state Event %s -  mapped %s', newValue, mappedValue)
      if ((self.initialQuery === false) && (self.lastValue !== mappedValue)) {
        let now = moment().unix()
        if (self.isTrue(newValue)) {
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
      self.log.debug('[Contact] will save %s to history', historyValue)

      self.addLogEntry({
        status: historyValue
      })
      self.initialQuery = false
      self.lastValue = mappedValue
      self.state.updateValue(mappedValue, null)
    })

    // this.addTamperedCharacteristic(this.contact) // Prevent eve from hiding this
    this.addLowBatCharacteristic()
  }

  initServiceSettings () {
    return {
      '*': {
        state: {
          name: 'STATE',
          boolean: true,
          mapping: {true: 1, false: 0},
          history: {true: 1, false: 0}
        }
      },
      'SHUTTER_CONTACT_TRANSCEIVER': {
        voltage: 2.4,
        state: {
          name: 'STATE',
          boolean: true,
          mapping: {true: 1, false: 0},
          history: {true: 1, false: 0}
        }
      },
      'ACCELERATION_TRANSCEIVER': {
        voltage: 2.4,
        state: {
          name: 'MOTION',
          boolean: true,
          mapping: {true: 1, false: 0},
          history: {true: 1, false: 0}
        }
      },
      'SENSOR': {
        state: {
          name: 'SENSOR',
          boolean: true,
          mapping: {true: 1, false: 0},
          history: {true: 1, false: 0}
        }
      }
    }
  }

  static channelTypes () {
    return ['CONTACT',
      'SHUTTER_CONTACT',
      'TILT_SENSOR',
      'HmIP-SAM:ACCELERATION_TRANSCEIVER',
      'SHUTTER_CONTACT_TRANSCEIVER',
      'HMW-Sen-SC-12-DR:SENSOR',
      'MULTI_MODE_INPUT_TRANSMITTER',
      'WRAPPER'
    ]
  }

  static serviceDescription () {
    return 'This service provides a Contact in HomeKit'
  }

  static configurationItems () {
    return {
      'reverse': {
        type: 'checkbox',
        default: false,
        label: 'Reverse the values',
        hint: 'on is off and off is on'
      }
    }
  }
}
module.exports = HomeMaticContactSensorAccessory
