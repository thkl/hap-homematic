/*
 * File: HomeMaticValveAccessory.js
 * Project: hap-homematic
 * File Created: Tuesday, 31st March 2020 6:43:31 pm
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

class HomeMaticValveAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let settings = this.getDeviceSettings()
    let strValveType = (settings.valveType !== undefined) ? settings.valveType : 'GENERIC_VALVE'

    // Load ValveType from parameters
    // Characteristic.ValveType.GENERIC_VALVE = 0;
    // Characteristic.ValveType.IRRIGATION = 1;
    // Characteristic.ValveType.SHOWER_HEAD = 2;
    // Characteristic.ValveType.WATER_FAUCET = 3;

    this.valveType = 0
    switch (strValveType) {
      case 'Irrigation':
        this.valveType = Characteristic.ValveType.IRRIGATION
        break
      case 'Shower head':
        this.valveType = Characteristic.ValveType.SHOWER_HEAD
        break
      case 'Water faucet':
        this.valveType = Characteristic.ValveType.WATER_FAUCET
        break
      default:
        this.valveType = Characteristic.ValveType.GENERIC_VALVE
        break
    }

    this.setDuration = this.getPersistentValue('duration', 0)

    this.log.debug('[VALVE] generate Valvetype %s', self.valveType)

    this.service = this.addService(new Service.Valve(this._name))
    this.remainTime = -99

    this.configured = this.service.getCharacteristic(Characteristic.IsConfigured)
      .on('get', (callback) => {
        callback(null, Characteristic.IsConfigured.CONFIGURED)
      })

    this.configured.updateValue(Characteristic.IsConfigured.CONFIGURED, null)

    this.cValveType = this.service.getCharacteristic(Characteristic.ValveType)
      .on('get', (callback) => {
        self.log.debug('[VALVE] get Valvetype %s', self.valveType)
        callback(null, self.valveType)
      })

    self.cValveType.updateValue(self.valveType, null)

    this.setDurationCharacteristic = this.service.getCharacteristic(Characteristic.SetDuration)
      .on('get', (callback) => {
        self.log.debug('[VALVE] get Characteristic.SetDuration')
        callback(null, self.setDuration)
      })

      .on('set', (value, callback) => {
        self.setDuration = parseInt(value)
        self.log.debug('[VALVE] set Characteristic.SetDuration %s', value)
        self.savePersistentValue('duration', self.setDuration)
        callback()
      })

    this.c_isActive = this.service.getCharacteristic(Characteristic.Active)
      .on('get', async (callback) => {
        let value = await self.getValue('STATE', true)
        let hmState = self.isTrue(value) ? 1 : 0
        self.log.debug('[VALVE] get Active %s', hmState)
        if (callback) callback(null, hmState)
      })

      .on('set', async (value, callback) => {
        self.log.debug('[VALVE] set Characteristic.Active %s', value)
        if (value === 0) {
          self.setValue('STATE', 0)
          self.remainTime = 0
          clearTimeout(self.valveTimer)
          self.log.debug('[VALVE] set Characteristic.Active to off done')
          callback()
        } else {
          self.remainTime = (self.setDuration) ? self.setDuration : 0

          self.isInUse = 1
          if (self.remainTime > 0) {
            self.log.debug('[VALVE] set Characteristic.Active-> HM ON time %s', self.remainTime)
            await self.setValue('ON_TIME', self.remainTime)
            self.log.debug('[VALVE] set Characteristic.Active-> HM to ONs')
            await self.setValue('STATE', 1)
            self.updateValveTimer()
            callback()
          } else {
            self.log.debug('[VALVE] set Characteristic.Active-> HM to ONs (0 time)')

            await self.setValue('STATE', 1)
            callback()
          }
        }
      })

    this.c_isInUse = this.service.getCharacteristic(Characteristic.InUse)
      .on('get', async (callback) => {
        let value = await self.getValue('STATE', true)
        let hmState = self.isTrue(value) ? 1 : 0
        self.log.debug('[VALVE] get inUse %s', hmState)
        if (callback) callback(null, hmState)
      })

      .on('set', (value, callback) => {
        self.isInUse = value
        callback()
      })

    this.c_timeRemain = this.service.getCharacteristic(Characteristic.RemainingDuration)
      .on('get', (callback) => {
        callback(null, self.remainTime)
      })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      let hmState = self.isTrue(newValue) ? 1 : 0
      self.log.debug('[VALVE] Event result %s hm %s', newValue, hmState)
      if (hmState === 0) {
        self.remainTime = 0
        if (self.c_timeRemain !== undefined) {
          self.c_timeRemain.updateValue(self.remainTime, null)
        }
      }

      if (self.c_isActive !== undefined) {
        self.log.debug('[VALVE] acTive %s', hmState)
        self.c_isActive.updateValue(hmState, null)
      }

      if (self.c_isOn !== undefined) {
        self.log.debug('[VALVE] isOn %s', hmState)
        self.c_isOn.updateValue(hmState, null)
      }

      if (self.c_isInUse !== undefined) {
        self.log.debug('[VALVE] inUse %s', hmState)
        self.c_isInUse.updateValue(hmState, null)
      }
    })
  }

  updateValveTimer () {
    let self = this
    if (this.remainTime === 0) {
      return
    }

    this.remainTime = this.remainTime - 1
    // SET OFF
    if (this.remainTime === 0) {
      self.setValue('STATE', 0)
      clearTimeout(this.valveTimer)
      self.getValue('STATE')
    }
    this.c_timeRemain.updateValue(this.remainTime, null)
    this.valveTimer = setTimeout(() => {
      self.updateValveTimer()
    }, 1000)
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.valveTimer)
  }

  static channelTypes () {
    return ['SWITCH', 'SWITCH_VIRTUAL_RECEIVER']
  }

  static getPriority () {
    return 1
  }

  static configurationItems () {
    return {
      'valveType': {
        type: 'option',
        array: ['Irrigation', 'Shower head', 'Water faucet', 'Generic'],
        default: 'Generic',
        label: 'Type of valve',
        hint: 'A valve can have different types'
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a valve in HomeKit based on a switch from your ccu'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticValveAccessory
