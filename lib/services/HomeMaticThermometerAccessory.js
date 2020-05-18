/*
 * File: HomeMaticThermometerAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 8th March 2020 3:14:23 pm
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

class HomeMaticThermometerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.temperatureSensor = this.getService(Service.TemperatureSensor)
    this.enableLoggingService('weather')
    this.currentTemperature = -255
    this.currentHumidity = -255
    let settings = this.getDeviceSettings()
    this.ignoreTemp = settings.IgnoreTempMeasurement || false
    this.ignoreHum = settings.IgnoreHumidiyMeasurement || false

    let active = this.temperatureSensor.getCharacteristic(Characteristic.StatusActive)
      .on('get', (callback) => {
        callback(null, 1)
      })
    active.updateValue(true, null)

    if (this.ignoreTemp === false) {
      this.cctemp = this.temperatureSensor.getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
          minValue: -100
        })
        .on('get', async (callback) => {
          let value = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
          let fval = parseFloat(value)
          self.currentTemperature = fval
          if (callback) callback(null, fval)
        })

      this.cctemp.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature', null, (newValue) => {
        self.log.debug('[HTA] TEMPERATURE event %s', newValue)
        self.currentTemperature = parseFloat(newValue)
        self.cctemp.updateValue(parseFloat(newValue), null)
        if ((self.currentTemperature > -255) && ((self.currentHumidity > -255) || (self.ignoreTemp === true))) {
          self.addLogEntry({ temp: (!self.ignoreTemp) ? self.currentTemperature : 0, pressure: 0, humidity: self.currentHumidity })
        }
      })
    }

    if (this.ignoreHum === false) {
      this.humiditySensor = this.getService(Service.HumiditySensor)

      let hactive = this.humiditySensor.getCharacteristic(Characteristic.StatusActive)
        .on('get', (callback) => {
          callback(null, true)
        })
      hactive.updateValue(true, null)

      this.chum = this.humiditySensor.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', async (callback) => {
          let value = await self.getValueForDataPointNameWithSettingsKey('Humidity', null, false)
          self.currentHumidity = parseFloat(value)
          if (callback) callback(null, value)
        })

      this.chum.eventEnabled = true
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Humidity', null, (newValue) => {
        self.log.debug('[HTA] HUMIDITY event %s', newValue)
        self.currentHumidity = parseFloat(newValue)
        self.chum.updateValue(parseFloat(newValue), null)
        if ((self.currentHumidity > -255) && ((self.currentTemperature > -255) || (self.ignoreTemp === true))) {
          self.addLogEntry({ temp: (!self.ignoreTemp) ? self.currentTemperature : 0, pressure: 0, humidity: self.currentHumidity })
        }
      })
    }
  }

  queryData () {
    var self = this
    this.log.debug('[HTA] periodic measurement')
    this.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
    this.getValueForDataPointNameWithSettingsKey('Humidity', null, false)
    this.refreshTimer = setTimeout(() => {
      self.queryData()
    }, 10 * 60 * 1000)
  }

  shutdown () {
    this.log.debug('[HTA] shutdown')
    super.shutdown()
    clearTimeout(this.refreshTimer)
  }

  static channelTypes () {
    return ['WEATHER',
      'CLIMATE_TRANSCEIVER',
      'HmIP-STHD:HEATING_CLIMATECONTROL_TRANSCEIVER',
      'HmIP-WTH-2:HEATING_CLIMATECONTROL_TRANSCEIVER',
      'HmIP-WTH:HEATING_CLIMATECONTROL_TRANSCEIVER'
    ]
  }

  initServiceSettings () {
    return {
      '*': {
        Temperature: {name: 'TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'}
      },
      'CLIMATE_TRANSCEIVER': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'}
      },
      'HEATING_CLIMATECONTROL_TRANSCEIVER': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'}
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a temperature sensor HomeKit'
  }

  static configurationItems () {
    return {
      'IgnoreTempMeasurement': {
        type: 'checkbox',
        default: false,
        label: 'Ignore temperature',
        hint: 'if your device only measures the humidity u should ignore the temperature measurements'
      },
      'IgnoreHumidiyMeasurement': {
        type: 'checkbox',
        default: false,
        label: 'Ignore humidity',
        hint: 'if your device only measures the temperature u should ignore the humidity measurements'
      }

    }
  }
}

module.exports = HomeMaticThermometerAccessory
