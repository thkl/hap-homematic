/*
 * File: HomeMaticThermSensorAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 22nd February 2021 6:25:50 pm
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

class HomeMaticThermSensorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.debugLog('launching Service')
    this.enableLoggingService('room')
    this.currentTemperature = -255

    let temperatureSensor1 = this.addService(new Service.TemperatureSensor(this._name + ' T1', 'T1'))

    let active1 = temperatureSensor1.getCharacteristic(Characteristic.StatusActive)
      .on('get', (callback) => {
        callback(null, 1)
      })
    active1.updateValue(true, null)

    let cctemp1 = temperatureSensor1.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Temperature1', null, false)
        let fval = parseFloat(value)
        self.debugLog('get TEMPERATURE C1 %s', value)
        self.currentTemperature = fval
        self.addHistory()
        if (callback) callback(null, fval)
      })

    cctemp1.eventEnabled = true

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature1', null, (newValue) => {
      self.debugLog('TEMPERATURE C1 event %s', newValue)
      self.currentTemperature = parseFloat(newValue)
      self.updateCharacteristic(cctemp1, parseFloat(newValue))
      self.addHistory()
    })

    let temperatureSensor2 = this.addService(new Service.TemperatureSensor(this._name + ' T2', 'T2'))
    let active2 = temperatureSensor2.getCharacteristic(Characteristic.StatusActive)
      .on('get', (callback) => {
        callback(null, 1)
      })
    active2.updateValue(true, null)

    let cctemp2 = temperatureSensor2.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Temperature2', null, false)
        let fval = parseFloat(value)
        if (callback) callback(null, fval)
      })

    cctemp2.eventEnabled = true

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature2', null, (newValue) => {
      self.debugLog('TEMPERATURE C2 event %s', newValue)
      self.updateCharacteristic(cctemp2, parseFloat(newValue))
    })

    let temperatureSensor3 = this.addService(new Service.TemperatureSensor(this._name + ' T3', 'T3'))
    let active3 = temperatureSensor3.getCharacteristic(Characteristic.StatusActive)
      .on('get', (callback) => {
        callback(null, 1)
      })
    active3.updateValue(true, null)

    let cctemp3 = temperatureSensor3.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Temperature3', null, false)
        let fval = parseFloat(value)
        if (callback) callback(null, fval)
      })

    cctemp3.eventEnabled = true

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature3', null, (newValue) => {
      self.debugLog('TEMPERATURE C3 event %s', newValue)
      self.updateCharacteristic(cctemp3, parseFloat(newValue))
    })

    this.addLowBatCharacteristic()
    this.queryData()
  }

  addHistory () {
    let entry = {
      temp: (!isNaN(this.currentTemperature)) ? this.currentTemperature : 0,
      ppm: 0,
      humidity: 0
    }
    this.debugLog('adding History T:%s, H: %s, Co2: %s', entry.temp, entry.humidity, entry.ppm)
    this.addLogEntry(entry)
  }

  async queryData () {
    clearTimeout(this.refreshTimer)
    var self = this
    this.debugLog('periodic measurement')

    this.getValueForDataPointNameWithSettingsKey('Temperature1', null, false)
    this.getValueForDataPointNameWithSettingsKey('Temperature2', null, false)
    this.getValueForDataPointNameWithSettingsKey('Temperature3', null, false)
    this.refreshTimer = setTimeout(() => {
      self.queryData()
    }, 10 * 60 * 1000)
  }

  shutdown () {
    this.debugLog('shutdown')
    super.shutdown()
    clearTimeout(this.refreshTimer)
  }

  static channelTypes () {
    return ['HmIP-STE2-PCB:COND_SWITCH_TRANSMITTER_TEMPERATURE']
  }

  initServiceSettings () {
    return {
      '*': {
        Temperature1: {name: '1.ACTUAL_TEMPERATURE'},
        Temperature2: {name: '2.ACTUAL_TEMPERATURE'},
        Temperature3: {name: '3.ACTUAL_TEMPERATURE'}
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a temperature sensor HomeKit'
  }

  static configurationItems () {
    return {

    }
  }
}

module.exports = HomeMaticThermSensorAccessory
