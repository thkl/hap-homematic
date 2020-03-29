const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticRainDetectorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    var self = this
    var rainSensor = this.getService(Service.HumiditySensor)

    this.state = rainSensor.getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', function (callback) {
        self.getValue('STATE', false).then(value => {
          if (callback) {
            callback(null, self.isTrue(value) ? 100 : 0)
          }
        })
      })

    this.state.eventEnabled = true

    this.enableLoggingService('motion')
    this.addLastActivationService(rainSensor)

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), function (newValue) {
      self.log.debug('[RAIN] Rain State event %s', newValue)
      let rainDetected = self.isTrue(newValue)
      if (rainDetected) {
        self.state.updateValue(100, null)
        self.updateLastActivation()
        self.addLogEntry({status: rainDetected ? 1 : 0})
      } else {
        self.state.updateValue(0, null)
      }
    })
  }

  static channelTypes () {
    return ['RAINDETECTOR']
  }
}
module.exports = HomeMaticRainDetectorAccessory
