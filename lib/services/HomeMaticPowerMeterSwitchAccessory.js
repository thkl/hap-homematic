/*
 * File: HomeMaticPowerMeterSwitchAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 14th March 2020 1:16:23 pm
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
const HomeMaticPowerMeterAccessory = require(path.join(__dirname, 'HomeMaticPowerMeterAccessory.js'))

class HomeMaticPowerMeterSwitchAccessory extends HomeMaticPowerMeterAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this
    let readOnly = this.isReadOnly()

    if (this.getDataPointNameFromSettings('switch', null)) {
      this.switchService = this.addService(new Service.Switch(this._name + ' On Off ', 'On Off'))
      this.isOnCharacteristic = this.switchService.getCharacteristic(Characteristic.On)
      this.isOnCharacteristic.on('get', async (callback) => {
        let state = await self.getValueForDataPointNameWithSettingsKey('switch', null, true)
        self.log.debug('[PMSWITCH] state %s', state)
        callback(null, self.isTrue(state))
      })

      this.isOnCharacteristic.on('set', (value, callback) => {
        if (!readOnly) {
          self.setValueForDataPointNameWithSettingsKey('switch', null, value)
        } else {
          // check the state 1 sec later to reset the homekit state
          setTimeout(() => {
            self.getValueForDataPointNameWithSettingsKey('switch', null, true)
          }, 1000)
        }
        callback()
      })

      if (self.logging === 'Switch') {
        this.addLastActivationService(this.switchService)
      }

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('switch', null, (newValue) => {
        self.log.debug('[PMSWITCH] event state %s', newValue)
        if (self.logging === 'Switch') {
          self.addLogEntry({status: self.isTrue(newValue) ? 1 : 0})
          if (self.isTrue(newValue)) {
            self.updateLastActivation()
          }
        }
        self.isOnCharacteristic.updateValue(self.isTrue(newValue), null)
      })
    }
  }

  queryData () {
    super.queryData()
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.refreshTimer)
    clearTimeout(this.initialQueryTimer)
  }

  initServiceSettings () {
    return {
      '*': {
        roChannel: 1,
        switch: '1.STATE',
        power: 'POWER',
        current: 'CURRENT',
        voltage: 'VOLTAGE',
        frequency: 'FREQUENCY',
        energyCounter: 'ENERGY_COUNTER'
      }
    }
  }

  static configurationItems () {
    return {
      'LogOption': {
        type: 'option',
        array: ['Power', 'Switch'],
        default: 'Power',
        label: 'Logging for',
        hint: 'Eve is only able to log on option.'
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a enery counter with a switch actor in HomeKit (this only works in eve)'
  }

  static channelTypes () {
    return ['POWERMETER']
  }
}
module.exports = HomeMaticPowerMeterSwitchAccessory
