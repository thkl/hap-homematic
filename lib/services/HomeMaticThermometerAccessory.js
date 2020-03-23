const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticThermometerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.temperature = this.getService(Service.TemperatureSensor)
    this.enableLoggingService('weather')
    this.currentTemperature = -255
    this.currentHumidity = -255
    let settings = this.getDeviceSettings()
    this.ignoreTemp = settings.IgnoreTempMeasurement || false
    this.ignoreHum = settings.IgnoreHumidiyMeasurement || false

    if (this.ignoreTemp === false) {
      this.cctemp = this.temperature.getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({
          minValue: -100
        })
        .on('get', function (callback) {
          self.getValue('TEMPERATURE', false).then(value => {
            let fval = parseFloat(value)
            self.currentTemperature = fval
            if (callback) callback(null, fval)
          })
        })

      this.cctemp.eventEnabled = true

      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('TEMPERATURE'), function (newValue) {
        self.log.debug('[HTA] TEMPERATURE event %s', newValue)
        self.currentTemperature = parseFloat(newValue)
        self.cctemp.updateValue(parseFloat(newValue), null)
        if ((self.currentTemperature > -255) && ((self.currentHumidity > -255) || (self.ignoreTemp === true))) {
          self.addLogEntry({ temp: (!self.ignoreTemp) ? self.currentTemperature : 0, pressure: 0, humidity: self.currentHumidity })
        }
      })
    }

    if (this.ignoreHum === false) {
      this.humidity = this.getService(Service.HumiditySensor)
      this.chum = this.humidity.getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', function (callback) {
          self.getValue('HUMIDITY', false).then(value => {
            self.currentHumidity = parseFloat(value)
            if (callback) callback(null, value)
          })
        })

      this.chum.eventEnabled = true
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('HUMIDITY'), function (newValue) {
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
    this.getValue('TEMPERATURE', false)
    this.getValue('HUMIDITY', false)
    this.refreshTimer = setTimeout(function () {
      self.queryData()
    }, 10 * 60 * 1000)
  }

  shutdown () {
    this.log.debug('[HTA] shutdown')
    super.shutdown()
    clearTimeout(this.refreshTimer)
  }

  static channelTypes () {
    return ['WEATHER']
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
