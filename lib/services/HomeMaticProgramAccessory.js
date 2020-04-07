const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticProgramAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var service = this.getService(Service.Switch)
    this.isOnCharacteristic = service.getCharacteristic(Characteristic.On)

    this.isOnCharacteristic.on('get', (callback) => {
      callback(null, false)
    })

    this.isOnCharacteristic.on('set', (value, callback) => {
      if (value === true) {
        self._ccu.runProgram(self._serial).then((result) => {
          self.isOnCharacteristic.updateValue(false, null)
        })
      }
      callback()
    })
  }

  static channelTypes () {
    return ['PROGRAMM']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticProgramAccessory
