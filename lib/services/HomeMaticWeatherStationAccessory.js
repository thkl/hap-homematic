/*
 * File: HomeMaticWeatherStationAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 5th April 2020 6:55:06 pm
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
const EveHomeKitWeatherTypes = require(path.join(__dirname, 'EveWeather.js'))
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticWeatherStationAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    // create characteristics
    let self = this
    var weatherStation
    this.applHome = (this._server.getConfig('disableHistory') === true)
    this.eveWeatherProg = new EveHomeKitWeatherTypes(this.gatoHomeBridge.hap)
    // create all optinal Characteristics
    if (!this.applHome) {
      this.debugLog('Using Eve Mode')
      weatherStation = this.getService(this.eveWeatherProg.Service.EveWeather)
      this.enableLoggingService('weather', false)
    } else {
      this.debugLog('Using AppleHome Mode')
      weatherStation = this.getService(new Service.TemperatureSensor(this._name))
      weatherStation.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity)
    }

    this.currentTemperature = -255
    this.currentHumidity = -255
    this.currentPressure = -255
    // temperature sensor
    if (this.getDataPointNameFromSettings('Temperature', null)) {
      this.currentTemperatureCharacteristic = weatherStation.getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -100 })
        .on('get', async (callback) => {
          let value = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, true)
          self.debugLog('getCurrentTemperature result %s', value)
          if (callback) callback(null, value)
        })

      this.currentTemperatureCharacteristic.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature', null, (newValue) => {
        self.currentTemperature = parseFloat(newValue)
        self.currentTemperatureCharacteristic.updateValue(parseFloat(newValue), null)
        if (!self.applHome) {
          self.addLogginEntry()
        }
      })
    } else {
      this.debugLog('no temp sensor %s')
      this.currentTemperature = 0
    }

    // humidity sensor
    if (this.getDataPointNameFromSettings('Humidity', null)) {
      if (!this.applHome) {
        this.currentHumidityCharacteristic = weatherStation.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      } else {
        // Create a new Sensor
        let humSensor = this.addService(new Service.HumiditySensor(this._name))
        this.currentHumidityCharacteristic = humSensor.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      }

      this.currentHumidityCharacteristic.on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('Humidity', null, true)
        self.currentHumidity = parseFloat(value)
        self.debugLog('getCurrentRelativeHumidity result %s', value)
        if (callback) callback(null, value)
      })

      this.currentHumidityCharacteristic.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Humidity', null, (newValue) => {
        self.currentHumidity = parseFloat(newValue)
        self.currentHumidityCharacteristic.updateValue(parseFloat(newValue), null)
        if (!self.applHome) {
          self.addLogginEntry()
        }
      })
    } else {
      this.currentHumidity = 0
    }

    if (!this.applHome) {
      this.debugLog('adding Brightness sensor to eve weather station')
      this.addSensor('Brightness', weatherStation, 'Brightness', Characteristic.CurrentAmbientLightLevel)
    } else {
      this.debugLog('adding Brightness sensor to Home LightSensor')
      let lightSensor = this.addService(new Service.LightSensor(this._name))
      this.addSensor('Brightness', lightSensor, 'Brightness', Characteristic.CurrentAmbientLightLevel)
      lightSensor.getCharacteristic(Characteristic.StatusActive).on('get', callback => { callback(null, true) })
    }

    // use all the optional stuff if the user not wants an appl home device
    if (!this.applHome) {
    // pressure sensor
      if (this.getDataPointNameFromSettings('AirPressure', null)) {
        this.currentPressureCharacteristic = weatherStation.getCharacteristic(this.eveWeatherProg.Characteristic.AirPressure)
          .on('get', async (callback) => {
            let value = await self.getValueForDataPointNameWithSettingsKey('AirPressure', null, true)
            if (callback) callback(null, value)
          })

        this.currentPressureCharacteristic.eventEnabled = true

        this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('AirPressure', null, (newValue) => {
          self.currentPressure = parseFloat(newValue)
          self.currentPressureCharacteristic.updateValue(parseFloat(newValue), null)
          self.addLogginEntry()
        })
      } else {
        this.currentPressure = 0
      }

      // SunShineDuration sensor
      if (this.getDataPointNameFromSettings('SunShineDuration', null)) {
        let setg = self.deviceServiceSettings('SunShineDuration', null)
        this.currentSunshineCharacteristic = weatherStation.getCharacteristic(this.eveWeatherProg.Characteristic.SunShineDuration)
          .on('get', async (callback) => {
            var duration = 0
            if ((setg) && (setg.type === 'Variable')) {
              let varName = self.getDataPointNameFromSettings('SunShineDuration', null) + self._ccuChannelId
              duration = await (self._ccu.getVariableValue(varName))
              duration = (parseFloat(duration) / 60).toFixed(2) // calculate hours
            } else {
              let value = await self.getValueForDataPointNameWithSettingsKey('SunShineDuration', null, true)
              duration = parseFloat(value)
              duration = (duration / 60).toFixed(2) // calculate hours
            }
            if (callback) callback(null, duration)
          })

        this.currentSunshineCharacteristic.eventEnabled = true
      }

      if (this.getDataPointNameFromSettings('Raincount', null)) {
        let setg = self.deviceServiceSettings('Raincount', null)
        this.currentRainCountCharacteristic = weatherStation.getCharacteristic(this.eveWeatherProg.Characteristic.RainDay)
          .on('get', async (callback) => {
            var rCount = 0
            if ((setg) && (setg.type === 'Variable')) {
              let varName = self.getDataPointNameFromSettings('Raincount', null) + self._ccuChannelId
              rCount = await (self._ccu.getVariableValue(varName))
              rCount = (parseFloat(rCount)).toFixed(2)
            } else {
              let value = await self.getValueForDataPointNameWithSettingsKey('Raincount', null, true)
              rCount = parseFloat(value)
              rCount = (parseFloat(rCount)).toFixed(2)
            }
            if (callback) callback(null, rCount)
          })

        this.currentRainCountCharacteristic.eventEnabled = true

        this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Raincount', null, (newValue) => {
          self.updateCharacteristic(self.currentRainCountCharacteristic, parseFloat(newValue))
        })
      }

      this.addSensor('Rain', weatherStation, 'RainBool', this.eveWeatherProg.Characteristic.RainBool, null, (vl) => { return self.isTrue(vl) })
      this.addSensor('Windspeed', weatherStation, '', this.eveWeatherProg.Characteristic.WindSpeed, null, (vl) => { return parseInt(vl) })
      this.addSensor('Winddirection', weatherStation, 'Wind direction', this.eveWeatherProg.Characteristic.WindDirection, null, (degree) => {
        return self.getWindDirection(degree)
      })
      this.addSensor('Windrange', weatherStation, 'Wind range', this.eveWeatherProg.Characteristic.Windrange, null, (vl) => { return parseInt(vl) })
    }
  }

  addSensor (configName, service, ServiceName, ServiceCharacteristics, remoteValueCallBack, converter) {
    let self = this
    this.debugLog('adding %s Sensor', configName)
    if (this.getDataPointNameFromSettings(configName, null)) {
      let currentCharacteristic = service.getCharacteristic(ServiceCharacteristics)
        .on('get', async (callback) => {
          self.debugLog('homekit get %s', configName)
          let value = await self.getValueForDataPointNameWithSettingsKey(configName, null, true)
          self.debugLog('homekit get %s result is %s', configName, value)
          if (converter) {
            value = converter(value)
          } else {
            value = parseFloat(value)
          }
          self.debugLog('get %s converged value is % this will be sent to homekit', configName, value)
          if (callback) {
            callback(null, value)
          }
        })

      currentCharacteristic.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory(configName, null, (newValue) => {
        self.debugLog('homekit event for %s with value %s', configName, newValue)
        if (converter) {
          newValue = converter(newValue)
        } else {
          parseFloat(newValue)
        }
        self.debugLog('homekit event for %s converged value is %s', configName, newValue)
        self.updateCharacteristic(currentCharacteristic, newValue)
        if (remoteValueCallBack) {
          remoteValueCallBack(parseFloat(newValue))
        }
      })
    }
  }

  getWindDirection (degree) {
    this.log.debug('[WST] convert %s', degree)
    if (degree === undefined) {
      return 'Unknown'
    }

    if (typeof degree !== 'string') {
      degree = parseInt(degree)
    }

    let cat = Math.round(degree % 360 / 22.5)
    let dir

    // TODO multilanguage
    switch (cat) {
      case 0:
        dir = 'N'
        break
      case 1:
        dir = 'NNE'
        break
      case 2:
        dir = 'NE'
        break
      case 3:
        dir = 'ENE'
        break
      case 4:
        dir = 'E'
        break
      case 5:
        dir = 'ESE'
        break
      case 6:
        dir = 'SE'
        break
      case 7:
        dir = 'SSE'
        break
      case 8:
        dir = 'S'
        break
      case 9:
        dir = 'SSW'
        break
      case 10:
        dir = 'SW'
        break
      case 11:
        dir = 'WSW'
        break
      case 12:
        dir = 'W'
        break
      case 13:
        dir = 'WNW'
        break
      case 14:
        dir = 'NW'
        break
      case 15:
        dir = 'NNW'
        break
      case 16:
        dir = 'N'
        break
      default:
        dir = 'Variable'
    }
    return dir
  }

  addLogginEntry () {
    if ((this.currentTemperature > -255) && (this.currentHumidity > -255) && (this.currentPressure > -255)) {
      this.log.debug('[WST] write log %s %s %s', this.currentTemperature, this.currentPressure, this.currentHumidity)
      this.addLogEntry({ temp: this.currentTemperature, pressure: this.currentPressure, humidity: this.currentHumidity })
    } else {
      this.log.debug('[WST] ignore log %s %s %s', this.currentTemperature, this.currentPressure, this.currentHumidity)
    }
  }

  static channelTypes () {
    return ['HB-UNI-Sen-WEA:WEATHER',
      'KS550:WEATHER',
      'HmIP-SWO-B:WEATHER_TRANSMIT',
      'HmIP-SWO-PR:WEATHER_TRANSMIT',
      'HmIP-SWO-PL:WEATHER_TRANSMIT'
    ]
  }

  initServiceSettings () {
    return {
      'HB-UNI-Sen-WEA': {
        Temperature: {name: 'TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'},
        AirPressure: {name: 'AIR_PRESSURE'},
        Brightness: {name: 'LUX'},
        Raincount: {name: 'RAIN_COUNTER'},
        Windspeed: {name: 'WIND_SPEED'},
        Winddirection: {name: 'WIND_DIRECTION'},
        Windrange: {name: 'WIND_DIRECTION_RANGE'}
      },
      'KS550': {
        Temperature: {name: 'TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'},
        Brightness: {name: 'BRIGHTNESS'},
        Raincount: {name: 'RAIN_COUNTER'},
        Rain: {name: 'RAINING'},
        Windspeed: {name: 'WIND_SPEED'},
        Winddirection: {name: 'WIND_DIRECTION'},
        Windrange: {name: 'WIND_DIRECTION_RANGE'}
      },
      'HmIP-SWO-B': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'},
        Brightness: {name: 'ILLUMINATION'},
        SunShineDuration: {name: 'svHmIPSunshineCounterToday_', type: 'Variable'},
        Windspeed: {name: 'WIND_SPEED'}
      },
      'HmIP-SWO-PR': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'},
        Brightness: {name: 'ILLUMINATION'},
        Raincount: {name: 'svHmIPRainCounterToday_', type: 'Variable'},
        Rain: {name: 'RAINING'},
        SunShineDuration: {name: 'svHmIPSunshineCounterToday_', type: 'Variable'},
        Winddirection: {name: 'WIND_DIR'},
        Windspeed: {name: 'WIND_SPEED'},
        Windrange: {name: 'WIND_DIR_RANGE'}
      },
      'HmIP-SWO-PL': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'HUMIDITY'},
        Brightness: {name: 'ILLUMINATION'},
        Raincount: {name: 'svHmIPRainCounterToday_', type: 'Variable'},
        Rain: {name: 'RAINING'},
        SunShineDuration: {name: 'svHmIPSunshineCounterToday_', type: 'Variable'},
        Winddirection: {name: 'WIND_DIR'},
        Windspeed: {name: 'WIND_SPEED'}
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a weather station for HomeKit'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticWeatherStationAccessory
