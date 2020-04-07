const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticDoorBellAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let service = this.addService(new Service.Doorbell(this._name))
    let self = this
    this.keyEvent = service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    this.initialQuery = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PRESS_SHORT'), (newValue) => {
      if (!self.initialQuery) {
        self.keyEvent.updateValue(0, null)
      }
      self.initialQuery = false
    })
  }

  static channelTypes () {
    return ['KEY']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }

  static getPriority () {
    return 1
  }
}

module.exports = HomeMaticDoorBellAccessory
