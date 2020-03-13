const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticThermometerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.temperature = this.getService(Service.TemperatureSensor)
    this.enableLoggingService('weather')
    this.currentTemperature = -255
    this.currentHumidity = -255

    this.cctemp = this.temperature.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', function (callback) {
        self.getValue('TEMPERATURE', true).then(value => {
          let fval = parseFloat(value)
          self.currentTemperature = fval
          if (callback) callback(null, fval)
        })
      })

    this.cctemp.eventEnabled = true

    this.humidity = this.getService(Service.HumiditySensor)
    this.chum = this.humidity.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', function (callback) {
        self.getValue('HUMIDITY', true).then(value => {
          self.currentHumidity = parseFloat(value)
          if (callback) callback(null, value)
        })
      })

    this.chum.eventEnabled = true

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('TEMPERATURE'), function (newValue) {
      self.log.debug('[HTA] TEMPERATURE event %s', newValue)
      self.currentTemperature = parseFloat(newValue)
      self.cctemp.updateValue(parseFloat(newValue), null)
      if ((self.currentTemperature > -255) && (self.currentHumidity > -255)) {
        self.addLogEntry({ temp: self.currentTemperature, pressure: 0, humidity: self.currentHumidity })
      }
    })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('HUMIDITY'), function (newValue) {
      self.log.debug('[HTA] HUMIDITY event %s', newValue)
      self.currentHumidity = parseFloat(newValue)
      self.chum.updateValue(parseFloat(newValue), null)

      if ((self.currentTemperature > -255) && (self.currentHumidity > -255)) {
        self.addLogEntry({ temp: self.currentTemperature, pressure: 0, humidity: self.currentHumidity })
      }
    })
  }

  queryData () {
    var self = this
    this.log.debug('[HTA] periodic measurement')
    this.getValue('TEMPERATURE', true)
    this.getValue('HUMIDITY', true)
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
    return ['HM-WDS30-T-O:WEATHER', 'HM-WDS30-OT2-SM:WEATHER']
  }
}

module.exports = HomeMaticThermometerAccessory
