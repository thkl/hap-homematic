const path = require('path')
const uuid = require('hap-nodejs').uuid
const util = require('util')

const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticWeatherStationAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    // create characteristics
    let self = this
    let settings = this.getDeviceSettings()
    var weatherStation
    this.applHome = settings.applHome || false

    // create all optinal Characteristics
    if (!this.applHome) {
      Characteristic.CurrentAirPressureCharacteristic = function () {
        Characteristic.call(this, 'AirPressure', uuid.generate('HomeMatic:customchar:CurrentAirPressureCharacteristic'))
        this.setProps({
          format: Characteristic.Formats.FLOAT,
          unit: 'hPa',
          minStep: 0.1,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        this.value = this.getDefaultValue()
      }
      util.inherits(Characteristic.CurrentAirPressureCharacteristic, Characteristic)

      Characteristic.IsRainingCharacteristic = function () {
        Characteristic.call(this, 'Regen', uuid.generate('HomeMatic:customchar:IsRainingCharacteristic'))
        this.setProps({
          format: Characteristic.Formats.BOOL,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        this.value = this.getDefaultValue()
      }
      util.inherits(Characteristic.IsRainingCharacteristic, Characteristic)

      Characteristic.WindSpeedCharacteristic = function () {
        Characteristic.call(this, 'Wind Geschwindigkeit', uuid.generate('HomeMatic:customchar:WindSpeedCharacteristic'))
        this.setProps({
          format: Characteristic.Formats.FLOAT,
          unit: 'km/h',
          minStep: 0.1,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        this.value = this.getDefaultValue()
      }
      util.inherits(Characteristic.WindSpeedCharacteristic, Characteristic)

      Characteristic.WindDirectionCharacteristic = function () {
        Characteristic.call(this, 'Wind Richtung', uuid.generate('HomeMatic:customchar:WindDirectionCharacteristic'))
        this.setProps({
          format: Characteristic.Formats.INTEGER,
          unit: Characteristic.Units.ARC_DEGREE,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        this.value = this.getDefaultValue()
      }
      util.inherits(Characteristic.WindDirectionCharacteristic, Characteristic)

      Characteristic.WindRangeCharacteristic = function () {
        Characteristic.call(this, 'Wind Schwankungsbreite', uuid.generate('HomeMatic:customchar:WindRangeCharacteristic'))
        this.setProps({
          format: Characteristic.Formats.INTEGER,
          unit: Characteristic.Units.ARC_DEGREE,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        this.value = this.getDefaultValue()
      }
      util.inherits(Characteristic.WindRangeCharacteristic, Characteristic)

      Characteristic.CurrentRainCountCharacteristic = function () {
        Characteristic.call(this, 'Rain count', uuid.generate('HomeMatic:customchar:CurrentRainCountCharacteristic'))
        this.setProps({
          format: Characteristic.Formats.FLOAT,
          unit: 'mm',
          minStep: 0.1,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        this.value = this.getDefaultValue()
      }
      util.inherits(Characteristic.CurrentRainCountCharacteristic, Characteristic)

      Characteristic.CurrentSunShineDurationCharacteristic = function () {
        Characteristic.call(this, 'Sunshine', uuid.generate('HomeMatic:customchar:CurrentSunShineDurationCharacteristic'))
        this.setProps({
          format: Characteristic.Formats.FLOAT,
          unit: 'hour',
          minStep: 0.1,
          perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        })
        this.value = this.getDefaultValue()
      }
      util.inherits(Characteristic.CurrentSunShineDurationCharacteristic, Characteristic)

      Service.WeatherStation = function (displayName, subtype) {
        Service.call(this, displayName, uuid.generate('HomeMatic:customchar:WeatherStation'), subtype)
        this.addCharacteristic(Characteristic.CurrentTemperature)
        this.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity)
        this.addOptionalCharacteristic(Characteristic.CurrentAirPressureCharacteristic)
        this.addOptionalCharacteristic(Characteristic.CurrentAmbientLightLevel)
        this.addOptionalCharacteristic(Characteristic.IsRainingCharacteristic)
        this.addOptionalCharacteristic(Characteristic.CurrentRainCountCharacteristic)
        this.addOptionalCharacteristic(Characteristic.WindSpeedCharacteristic)
        this.addOptionalCharacteristic(Characteristic.WindDirectionCharacteristic)
        this.addOptionalCharacteristic(Characteristic.WindRangeCharacteristic)
        this.addOptionalCharacteristic(Characteristic.CurrentSunShineDurationCharacteristic)
      }
      util.inherits(Service.WeatherStation, Service)
      weatherStation = this.addService(new Service.WeatherStation(this._name))
    } else {
      weatherStation = this.addService(new Service.TemperatureSensor(this._name))
      weatherStation.addOptionalCharacteristic(Characteristic.CurrentRelativeHumidity)
      weatherStation.addOptionalCharacteristic(Characteristic.CurrentAmbientLightLevel)
    }

    this.enableLoggingService('weather', false)
    this.currentTemperature = -255
    this.currentHumidity = -255
    this.currentPressure = -255
    // temperature sensor
    if (this.getDataPointNameFromSettings('Temperature', null)) {
      this.currentTemperatureCharacteristic = weatherStation.getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -100 })
        .on('get', async (callback) => {
          let value = await self.getValueForDataPointNameWithSettingsKey('Temperature', null, false)
          if (callback) callback(null, value)
        })

      this.currentTemperatureCharacteristic.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Temperature', null, (newValue) => {
        self.currentTemperature = parseFloat(newValue)
        self.currentTemperatureCharacteristic.updateValue(parseFloat(newValue), null)
        self.addLogginEntry()
      })
    } else {
      this.log.debug('[WST] no temp sensor %s')
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
        let value = await self.getValueForDataPointNameWithSettingsKey('Humidity', null, false)
        if (callback) callback(null, value)
      })

      this.currentHumidityCharacteristic.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('Humidity', null, (newValue) => {
        self.currentHumidity = parseFloat(newValue)
        self.currentHumidityCharacteristic.updateValue(parseFloat(newValue), null)
        self.addLogginEntry()
      })
    } else {
      this.currentHumidity = 0
    }

    if (!this.applHome) {
      this.addSensor('Brightness', weatherStation, 'Brightness', Characteristic.CurrentAmbientLightLevel)
    } else {
      let lightSensor = this.addService(new Service.LightSensor(this._name))
      this.addSensor('Brightness', lightSensor, 'Brightness', Characteristic.CurrentAmbientLightLevel)
    }

    // use all the optional stuff if the user not wants an appl home device
    if (!this.applHome) {
    // pressure sensor
      if (this.getDataPointNameFromSettings('AirPressure', null)) {
        this.currentPressureCharacteristic = weatherStation.getCharacteristic(Characteristic.CurrentAirPressureCharacteristic)
          .on('get', async (callback) => {
            let value = await self.getValueForDataPointNameWithSettingsKey('AirPressure', null, false)
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
        this.currentSunshineCharacteristic = weatherStation.getCharacteristic(Characteristic.CurrentSunShineDurationCharacteristic)
          .on('get', async (callback) => {
            var duration = 0
            if ((setg) && (setg.type === 'Variable')) {
              let varName = self.getDataPointNameFromSettings('SunShineDuration', null) + self._ccuChannelId
              duration = await (self._ccu.getVariableValue(varName))
              duration = (parseFloat(duration) / 60).toFixed(2) // calculate hours
            } else {
              let value = await self.getValueForDataPointNameWithSettingsKey('SunShineDuration', null, false)
              duration = parseFloat(value)
              duration = (duration / 60).toFixed(2) // calculate hours
            }
            if (callback) callback(null, duration)
          })

        this.currentSunshineCharacteristic.eventEnabled = true
      }

      // SunShineDuration sensor
      if (this.getDataPointNameFromSettings('Raincount', null)) {
        let setg = self.deviceServiceSettings('Raincount', null)
        this.currentRainCountCharacteristic = weatherStation.getCharacteristic(Characteristic.CurrentRainCountCharacteristic)
          .on('get', async (callback) => {
            var rCount = 0
            if ((setg) && (setg.type === 'Variable')) {
              let varName = self.getDataPointNameFromSettings('Raincount', null) + self._ccuChannelId
              rCount = await (self._ccu.getVariableValue(varName))
              rCount = (parseFloat(rCount)).toFixed(2)
            } else {
              let value = await self.getValueForDataPointNameWithSettingsKey('Raincount', null, false)
              rCount = parseFloat(value)
              rCount = (parseFloat(rCount)).toFixed(2)
            }
            if (callback) callback(null, rCount)
          })

        this.currentRainCountCharacteristic.eventEnabled = true
      }

      this.addSensor('Rain', weatherStation, 'Rain', Characteristic.IsRainingCharacteristic)
      this.addSensor('Windspeed', weatherStation, 'Wind speed', Characteristic.WindSpeedCharacteristic)
      this.addSensor('Winddirection', weatherStation, 'Wind direction', Characteristic.WindDirectionCharacteristic)
      this.addSensor('Windrange', weatherStation, 'Wind range', Characteristic.WindRangeCharacteristic)
    }
  }

  addSensor (configName, service, ServiceName, ServiceCharacteristics, remoteValueCallBack) {
    let self = this
    this.log.debug('[WST] adding %s Sensor', configName)
    if (this.getDataPointNameFromSettings(configName, null)) {
      this.currentCharacteristic = service.getCharacteristic(ServiceCharacteristics)
        .on('get', async (callback) => {
          let value = await self.getValueForDataPointNameWithSettingsKey(configName, null, false)
          if (callback) callback(null, value)
        })

      this.currentCharacteristic.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory(configName, null, (newValue) => {
        self.currentCharacteristic.updateValue(parseFloat(newValue), null)
        if (remoteValueCallBack) {
          remoteValueCallBack(parseFloat(newValue))
        }
      })
    }
  }

  addLogginEntry () {
    if ((this.currentTemperature > -255) && (this.currentHumidity > -255) && (this.currentPressure > -255)) {
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

  static configurationItems () {
    return {
      'applHome': {
        type: 'checkbox',
        default: false,
        label: 'Apple Home compatible',
        hint: 'creates an Apple Home App compatible Device. This will only show temperature, humidity and light level'
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a weather station for HomeKit (only works in eve)'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticWeatherStationAccessory
