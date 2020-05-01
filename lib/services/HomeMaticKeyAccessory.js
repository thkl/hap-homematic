// this Accessory will spawn a event to the Server if set
// usefull for reloading action
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticKeyAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.switch = this.getService(Service.StatelessProgrammableSwitch)
    this.keyEvent = this.switch.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    this.initialQueryShort = true
    this.initialQueryLong = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PRESS_SHORT'), (newValue) => {
      if (!self.initialQueryShort) {
        self.keyEvent.updateValue(0, null)
        if (self.PressShortMessage) {
          self.emit(self.PressShortMessage)
        }
      }
      self.initialQueryShort = false
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PRESS_LONG'), (newValue) => {
      if (!self.initialQueryLong) {
        self.keyEvent.updateValue(2, null)
        if (self.PressLongMessage) {
          self.emit(self.PressLongMessage)
        }
      }
      self.initialQueryLong = false
    })
  }

  static channelTypes () {
    return ['KEY', 'VIRTUAL_KEY', 'KEY_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a programmable switch in HomeKit based on a ccu KEY'
  }
}
module.exports = HomeMaticKeyAccessory
