// this Accessory will spawn a event to the Server if set
// usefull for reloading action
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticKeyAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.switch = this.getService(Service.StatelessProgrammableSwitch)
    this.keyEvent = this.switch.getCharacteristic(Characteristic.ProgrammableSwitchEvent)

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PRESS_SHORT'), function (newValue) {
      self.keyEvent.updateValue(0, null)
      if (self.PressShortMessage) {
        self.emit(self.PressShortMessage)
      }
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PRESS_LONG'), function (newValue) {
      self.keyEvent.updateValue(2, null)
      if (self.PressLongMessage) {
        self.emit(self.PressLongMessage)
      }
    })
  }

  static channelTypes () {
    return ['KEY']
  }
}
module.exports = HomeMaticKeyAccessory
