const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSwitchAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var service
    let subType = this._settings.Type || 'Lightbulb'

    switch (subType) {
      case 'Outlet':
        service = this.getService(Service.Switch)
        break
      case 'Switch':
        service = this.getService(Service.Outlet)
        break
      default:
        service = this.getService(Service.Lightbulb)
        break
    }

    this.log.debug('[SWITCH] creating Service %s', subType)
    this.isOnCharacteristic = service.getCharacteristic(Characteristic.On)

    this.isOnCharacteristic.on('get', function (callback) {
      self.getValue('STATE', false).then(value => {
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

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), function (newValue) {
      self.log.debug('[SWITCH] event state %s', newValue)
      // Add a Log Entry for Eve
      self.addLogEntry({status: self.isTrue(newValue) ? 1 : 0})
      // Set Last Activation if the switch is on
      if (self.isTrue(newValue)) {
        self.updateLastActivation()
      }
      self.isOnCharacteristic.updateValue(self.isTrue(newValue), null)
    })
    // Loggin only works on Switches
    if (subType === 'Switch') {
      this.enableLoggingService('switch')
      this.addLastActivationService(service)
    }
  }

  static channelTypes () {
    return ['SWITCH']
  }
}

module.exports = HomeMaticSwitchAccessory
