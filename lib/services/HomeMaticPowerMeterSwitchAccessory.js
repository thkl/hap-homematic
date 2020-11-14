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
  initAccessoryService (Service) {
    this.debugLog('initAccessoryService')
    this.service = this.getService(new Service.Outlet(this._name))
    this.service.addOptionalCharacteristic(this.eve.Characteristic.TotalConsumption)
    this.service.addOptionalCharacteristic(this.eve.Characteristic.ElectricCurrent)
    this.service.addOptionalCharacteristic(this.eve.Characteristic.Voltage)
    this.service.addOptionalCharacteristic(this.eve.Characteristic.ElectricPower)
    this.service.addOptionalCharacteristic(this.eve.Characteristic.FirmwareInfo)
    this.enableLoggingService('energy')
  }

  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this
    let readOnly = this.isReadOnly()
    let onTime = this.getDeviceSettings().OnTime

    if (this.getDataPointNameFromSettings('switch', null)) {
      this.debugLog('adding isOn isOnCharacteristic')
      this.isOnCharacteristic = this.service.getCharacteristic(Characteristic.On)
      this.isOnCharacteristic.on('get', async (callback) => {
        self.debugLog('get state fetch CCU State')

        let state = await self.getValueForDataPointNameWithSettingsKey('switch', null, true)
        self.debugLog('get state %s', state)
        self.currentStatus = self.isTrue(state)
        callback(null, self.currentStatus)
      })

      this.isOnCharacteristic.on('set', async (value, callback) => {
        self.debugLog('set %s', value)
        if (!readOnly) {
          if ((self.isTrue(value)) && (onTime) && (parseInt(onTime) > 0)) {
            self.debugLog('set onTime %s seconds', onTime)
            await self.setValueForDataPointNameWithSettingsKey('ontime', null, onTime)
          }

          self.setValueForDataPointNameWithSettingsKey('switch', null, value)
        } else {
          // check the state 1 sec later to reset the homekit state
          setTimeout(() => {
            self.getValueForDataPointNameWithSettingsKey('switch', null, true)
          }, 1000)
        }
        callback()
      })

      this.service.getCharacteristic(Characteristic.OutletInUse).on('get', (callback) => { callback(null, true) })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('switch', null, (newValue) => {
        self.debugLog('event state %s', newValue)
        self.currentStatus = self.isTrue(newValue)
        if (self.isTrue(newValue)) {
          self.updateLastActivation()
        }
        self.updateLog()
        self.updateCharacteristic(self.isOnCharacteristic, self.isTrue(newValue))
      })
    }

    this.addLastActivationService(this.loggingService)
  }

  updateLog () {
    if (this.isOnCharacteristic) {
      this.addLogEntry({status: this.currentStatus ? 1 : 0})
      this.addLogEntry({power: this.currentPower})
    } else {
      this.addLogEntry({power: this.currentPower})
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
        ontime: '1.ON_TIME',
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
      'OnTime': {
        type: 'number',
        default: 0,
        label: 'On Time',
        hint: 'HAP will switch off this device automatically after the given seconds. Set this to 0 to turn off this feature.'
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
