const path = require('path')
const HomeMaticMotionAccessory = require(path.join(__dirname, 'HomeMaticMotionAccessory.js'))

class HomeMaticPresenceAccessory extends HomeMaticMotionAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this

    let activeButton = this.getService(Service.Switch, 'Is Active', true, 'isActive')
    this.activeCharacteristic = activeButton.getCharacteristic(Characteristic.On)

      .on('get', function (callback) {
        self.getValue('PRESENCE_DETECTION_ACTIVE', true).then((value) => {
          if (callback) callback(null, self.isTrue(value))
        })
      })

      .on('set', function (value, callback) {
        self.setValue('PRESENCE_DETECTION_ACTIVE', value)
        callback()
      })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('PRESENCE_DETECTION_ACTIVE'), function (newValue) {
      self.activeCharacteristic.updateValue(self.isTrue(newValue), null)
    })

    this.getHomeKitAccessory().setPrimaryService(this.motionSensor)
    this.motionSensor.addLinkedService(activeButton)
  }

  getDataPointName (type) {
    return {motion: 'PRESENCE_DETECTION_STATE', illumination: 'CURRENT_ILLUMINATION'}[type]
  }

  static channelTypes () {
    return ['PRESENCEDETECTOR_TRANSCEIVER']
  }
}

module.exports = HomeMaticPresenceAccessory
