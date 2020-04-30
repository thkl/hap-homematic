// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticPushTheButtonAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let evntType = this.getDeviceSettings().evntType || 'PRESS_SHORT'

    let service = this.addService(new Service.Switch(this._name))
    let isOn = service.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })
      .on('set', (value, callback) => {
        self.setValue(evntType, true)
        setTimeout(() => {
          isOn.updateValue(false, null)
        }, 500)
        callback()
      })
  }

  static channelTypes () {
    return ['KEY', 'VIRTUAL_KEY', 'KEY_TRANSCEIVER']
  }

  static configurationItems () {
    return {
      'evntType': {
        type: 'option',
        array: ['PRESS_SHORT', 'PRESS_LONG'],
        default: 'PRESS_SHORT',
        label: 'Key Event',
        hint: 'Which event should be fired'
      }
    }
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticPushTheButtonAccessory
