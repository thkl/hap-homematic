/*
 * File: HomeMaticPowerMeterAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 9th March 2020 7:09:33 pm
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

class HomeMaticPowerMeterAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    this.refreshTime = 10 * 60 * 1000
    this.service = this.getService(this.eve.Service.PowerMeterService)
    this.enableLoggingService('energy')

    if (this.getDataPointNameFromSettings('power', null)) {
      this.power = this.service.getCharacteristic(this.eve.Characteristic.ElectricPower)
        .on('get', (callback) => {
          self.getValueForDataPointNameWithSettingsKey('power', null, true).then(value => {
          // logging will be done by the event handler
            if (callback) callback(null, value)
          })
        })

      this.power.eventEnabled = true
    }

    if (this.getDataPointNameFromSettings('energyCounter', null)) {
      this.energyCounter = this.service.getCharacteristic(this.eve.Characteristic.TotalConsumption)
        .on('get', (callback) => {
          self.getValueForDataPointNameWithSettingsKey('energyCounter', null, true).then(value => {
            // CCU sends wH -- homekit haz kwh - so calculate /1000
            value = Number((value / 1000)).toFixed(2)
            if (callback) {
              callback(null, value)
            }
          })
        })

      this.energyCounter.eventEnabled = true
    }

    if (this.getDataPointNameFromSettings('current', null)) {
      this.currentCharacteristic = this.service.getCharacteristic(this.eve.Characteristic.ElectricCurrent)
        .on('get', (callback) => {
          self.getValueForDataPointNameWithSettingsKey('current', null, false).then(value => {
            if (callback) {
              callback(null, (parseFloat(value) / 1000))
            }
          })
        })

      this.currentCharacteristic.eventEnabled = true
    }

    if (this.getDataPointNameFromSettings('voltage', null)) {
      this.voltageCharacteristic = this.service.getCharacteristic(this.eve.Characteristic.Voltage)
        .on('get', (callback) => {
          self.getValueForDataPointNameWithSettingsKey('voltage', null, false).then(value => {
            if (callback) {
              callback(null, parseInt(value))
            }
          })
        })

      this.voltageCharacteristic.eventEnabled = true
    }

    this.addResetStatistics(this.service, () => {
      self.log.debug('[PMS] reset Stats')
    })

    if (this.power) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('power', null, (newValue) => {
        self.addLogEntry({ power: parseFloat(newValue) })
        self.power.updateValue(parseFloat(newValue), null)
      })
    }

    if (this.energyCounter) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('energyCounter', null, (newValue) => {
      // CCU sends wH -- homekit haz kwh - so calculate /1000
        let value = (parseFloat(newValue) / 1000)
        self.energyCounter.updateValue(Number(value).toFixed(2), null)
      })
    }

    if (this.currentCharacteristic) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('current', null, (newValue) => {
        // CCU reports Milli Amps / Homekit Amps
        let value = (parseFloat(newValue) / 1000)
        self.currentCharacteristic.updateValue(value, null)
      })
    }

    if (this.voltageCharacteristic) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('voltage', null, (newValue) => {
        self.voltageCharacteristic.updateValue(parseInt(newValue), null)
      })
    }

    this.initialQueryTimer = setTimeout(() => {
      self.queryData()
    }, self.refreshTime)
  }

  queryData () {
    var self = this
    if (this.power) { this.getValueForDataPointNameWithSettingsKey('power', null, false) }
    if (this.energyCounter) { this.getValueForDataPointNameWithSettingsKey('energyCounter', null, false) }
    if (this.currentCharacteristic) { this.getValueForDataPointNameWithSettingsKey('current', null, false) }
    if (this.voltageCharacteristic) { this.getValueForDataPointNameWithSettingsKey('voltage', null, false) }
    // create timer to query device every 10 minutes
    this.refreshTimer = setTimeout(() => { self.queryData() }, self.refreshTime)
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.refreshTimer)
    clearTimeout(this.initialQueryTimer)
  }

  initServiceSettings () {
    return {
      '*': {
        power: 'POWER',
        energyCounter: 'ENERGY_COUNTER'
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a enery counter in HomeKit (this only works in eve)'
  }

  static channelTypes () {
    return ['POWERMETER_IGL']
  }
}
module.exports = HomeMaticPowerMeterAccessory
