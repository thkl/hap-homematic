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

class HomeMaticHumidityAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.debugLog('launching Service')
    this.service = this.getService(Service.HumiditySensor)
    this.enableLoggingService('room')

    this.char = this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    this.active = this.service.getCharacteristic(Characteristic.StatusActive)
    this.active.on('get', (callback) => {
      callback(null, true)
    })

    this.enableLoggingService('weather', false)

    this.chum = this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Humidity', null, false)
        let currentHumidity = parseFloat(value)
        self.addLogEntry({
          temp: 0, pressure: 0, humidity: currentHumidity
        })
        if (callback) callback(null, currentHumidity)
      })

    this.chum.eventEnabled = true
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Humidity', null, (newValue) => {
      self.debugLog('HUMIDITY event %s', newValue)
      let currentHumidity = parseFloat(newValue)
      self.updateCharacteristic(self.chum, currentHumidity)
      self.addLogEntry({
        temp: 0, pressure: 0, humidity: currentHumidity
      })
    })
  }

  static channelTypes () {
    return ['WEATHER',
      'CLIMATE_TRANSCEIVER',
      'HmIP-STHD:HEATING_CLIMATECONTROL_TRANSCEIVER',
      'HmIP-WTH-2:HEATING_CLIMATECONTROL_TRANSCEIVER',
      'HmIP-WTH:HEATING_CLIMATECONTROL_TRANSCEIVER',
      'HmIP-BWTH:HEATING_CLIMATECONTROL_TRANSCEIVER',
      'WEATHER_TRANSMIT'
    ]
  }

  initServiceSettings () {
    return {
      '*': {
        Humidity: {name: 'HUMIDITY'}
      },
      'CLIMATE_TRANSCEIVER': {
        voltage: 2.4,
        Humidity: {name: 'HUMIDITY'}
      },
      'HEATING_CLIMATECONTROL_TRANSCEIVER': {
        voltage: 2.4,
        Humidity: {name: 'HUMIDITY'}
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a humidity sensor for HomeKit'
  }

  static configurationItems () {
    return {}
  }
}

module.exports = HomeMaticHumidityAccessory
