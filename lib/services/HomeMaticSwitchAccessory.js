const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSwitchAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.log.debug('[SWITCH] creating Service')
    let lightBulbService = this.getService(Service.Lightbulb)
    this.isOnCharacteristic = lightBulbService.getCharacteristic(Characteristic.On)

    this.isOnCharacteristic.on('get', function (callback) {
      self.getValue('STATE').then(value => {
        callback(null, self.isTrue(value))
      })
    })

    this.isOnCharacteristic.on('set', function (value, callback) {
      if (value === false) {
        self.setValue('STATE', 0)
      } else {
        self.setValue('STATE', 1)
      }
      callback()
    })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('STATE'), function (newValue) {
      self.log.debug('[SWITCH] event state %s', newValue)
      self.isOnCharacteristic.updateValue(self.isTrue(newValue), null)
    })
  }
}

module.exports = HomeMaticSwitchAccessory
