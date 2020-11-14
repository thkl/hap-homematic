/*
 * File: HomeMaticFlowerCareAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 12.11. 2020 3:14:23 pm
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
const EveHomeKitFertilityTypes = require(path.join(__dirname, 'FlowerCare.js'))

class HomeMaticFlowerCareAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.debugLog('launching Service')
    this.service = this.getService(Service.HumiditySensor)
    this.currentTemperature = -255
    this.currentHumidity = -255

    this.flowerCharacteristic = new EveHomeKitFertilityTypes(this.gatoHomeBridge.hap)
    this.char = this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    this.active = this.service.getCharacteristic(Characteristic.StatusActive)
    this.active.on('get', (callback) => {
      callback(null, 1)
    })

    this.service.addOptionalCharacteristic(this.flowerCharacteristic.Characteristic.SoilFertility)
    this.service.addOptionalCharacteristic(this.flowerCharacteristic.Characteristic.FertilityAlarm)
    this.service.addOptionalCharacteristic(this.flowerCharacteristic.Characteristic.MoistureAlarm)

    this.service.addOptionalCharacteristic(Characteristic.CurrentAmbientLightLevel)
    this.service.addOptionalCharacteristic(Characteristic.CurrentTemperature)

    this.updateCharacteristic(this.active, 1)

    this.enableLoggingService('weather', false)
    // Humidity
    let chum = this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', async (callback) => {
        let newValue = await self.getValueForDataPointNameWithSettingsKey('Humidity', null, false)
        self.currentHumidity = parseFloat(newValue)
        self.addHistory()
        if (callback) callback(null, self.currentHumidity)
      })

    chum.eventEnabled = true
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Humidity', null, (newValue) => {
      self.currentHumidity = parseFloat(newValue)
      self.updateCharacteristic(chum, self.currentHumidity)
      self.addHistory()
    })

    // temperature
    let ctemp = this.service.getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', async (callback) => {
        let newValue = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
        self.currentTemperature = parseFloat(newValue)
        self.addHistory()
        if (callback) callback(null, self.currentTemperature)
      })

    ctemp.eventEnabled = true
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature', null, (newValue) => {
      self.currentTemperature = parseFloat(newValue)
      self.updateCharacteristic(ctemp, self.currentTemperature)
      self.addHistory()
    })
    // brightnezz
    let cbri = this.service.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .on('get', async (callback) => {
        let newValue = await self.getValueForDataPointNameWithSettingsKey('Brightness', null, false)
        if (callback) callback(null, parseFloat(newValue))
      })

    cbri.eventEnabled = true
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Brightness', null, (newValue) => {
      self.updateCharacteristic(cbri, parseFloat(newValue))
    })

    let cfert = this.service.getCharacteristic(this.flowerCharacteristic.Characteristic.SoilFertility)
      .on('get', async (callback) => {
        let newValue = await self.getValueForDataPointNameWithSettingsKey('Fertilizer', null, false)
        if (callback) callback(null, parseFloat(newValue))
      })

    cfert.eventEnabled = true
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Fertilizer', null, (newValue) => {
      self.updateCharacteristic(cfert, parseFloat(newValue))
    })

    let cfertAlarm = this.service.getCharacteristic(this.flowerCharacteristic.Characteristic.FertilityAlarm)
      .on('get', async (callback) => {
        let newValue = await self.getValueForDataPointNameWithSettingsKey('FertilizerAlarm', null, false)
        if (callback) callback(null, self.isTrue(newValue))
      })

    cfertAlarm.eventEnabled = true
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('FertilizerAlarm', null, (newValue) => {
      self.updateCharacteristic(cfertAlarm, self.isTrue(newValue))
    })

    let cMoistAlarm = this.service.getCharacteristic(this.flowerCharacteristic.Characteristic.MoistureAlarm)
      .on('get', async (callback) => {
        let newValue = await self.getValueForDataPointNameWithSettingsKey('MoistureAlarm', null, false)
        if (callback) callback(null, self.isTrue(newValue))
      })

    cMoistAlarm.eventEnabled = true
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('MoistureAlarm', null, (newValue) => {
      self.updateCharacteristic(cMoistAlarm, self.isTrue(newValue))
    })

    this.addLowBatCharacteristic()
  }

  addHistory () {
    if (
      ((this.currentHumidity > -255) || (this.ignoreHum === true)) &&
         ((this.currentTemperature > -255) || (this.ignoreTemp === true))
    ) {
      let entry = {
        temp: (((!this.ignoreTemp) && (!isNaN(this.currentTemperature))) ? this.currentTemperature : 0),
        ppm: 0,
        humidity: (((!this.ignoreHum) && (!isNaN(this.currentHumidity))) ? this.currentHumidity : 0)
      }
      this.debugLog('adding History T:%s, H: %s, Co2: %s', entry.temp, entry.humidity, entry.ppm)
      this.addLogEntry(entry)
    }
  }

  static channelTypes () {
    return ['FLOWERCARE']
  }

  initServiceSettings () {
    return {
      'FLOWERCARE': {
        Humidity: {name: 'SOILMOISTURE'},
        Brightness: {name: 'BRIGHTNESS'},
        Fertilizer: {name: 'FERTILISER'},
        Temperature: {name: 'TEMPERATURE'},
        FertilizerAlarm: {name: 'ALARM_FERTILISER'},
        MoistureAlarm: {name: 'ALARM_SOILMOISTURE'}
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a flower sensor for HomeKit'
  }

  static configurationItems () {
    return {}
  }
}

module.exports = HomeMaticFlowerCareAccessory
