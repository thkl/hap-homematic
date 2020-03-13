// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticDummyAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var leakSensor = this.getService(Service.X)
    this.state = leakSensor.getCharacteristic(Characteristic.X)
      .on('get', function (callback) {
        self.getValue('STATE', true).then((value) => {
          if (callback) callback(null, value)
        })
      })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('STATE'), function (newValue) {
      self.state.updateValue(0, null)
    })
  }

  static channelTypes () {
    return ['DUMMY']
  }

  configurationItems () {
    this.log.warn('[DUMMY] OVERRIDE THIS TO SPECIFY THE CONFIG ITEMS FOR THE SERVICE')
    return []
  }

  validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticDummyAccessory
