const path = require('path')
const uuid = require('hap-nodejs').uuid
const util = require('util')

const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticWeatherStationAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    // create characteristics
    let self = this

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
    }
    util.inherits(Service.WeatherStation, Service)

    this.enableLoggingService('weather', false)
    this.currentTemperature = -255
    this.currentHumidity = -255
    this.currentPressure = -255
    let weatherStation = this.addService(new Service.WeatherStation(this._name))
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
      this.currentHumidityCharacteristic = weatherStation.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', async (callback) => {
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

    this.addSensor('Brightness', weatherStation, 'Brightness', Characteristic.CurrentAmbientLightLevel)
    this.addSensor('Rain', weatherStation, 'Rain', Characteristic.IsRainingCharacteristic)
    this.addSensor('Raincount', weatherStation, 'Rain count', Characteristic.CurrentRainCountCharacteristic)
    this.addSensor('Windspeed', weatherStation, 'Wind speed', Characteristic.WindSpeedCharacteristic)
    this.addSensor('Winddirection', weatherStation, 'Wind direction', Characteristic.WindDirectionCharacteristic)
    this.addSensor('Windrange', weatherStation, 'Wind range', Characteristic.WindRangeCharacteristic)
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
    return ['HB-UNI-Sen-WEA:WEATHER', 'KS550:WEATHER']
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
      }
    }
  }

  static configurationItems () {
    return {}
  }

  static serviceDescription () {
    return 'This service provides a weather station for HomeKit (only works in eve)'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticWeatherStationAccessory
