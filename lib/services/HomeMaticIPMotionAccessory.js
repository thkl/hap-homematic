const path = require('path')
const HomeMaticMotionAccessory = require(path.join(__dirname, 'HomeMaticMotionAccessory.js'))

class HomeMaticIPMotionAccessory extends HomeMaticMotionAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    super.publishServices(Service, Characteristic)

    if (this.getDataPointNameFromSettings('active') !== undefined) {
      let activeButton = this.getService(Service.Switch, 'Is Active', true, 'isActive')
      this.activeCharacteristic = activeButton.getCharacteristic(Characteristic.On)

        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('active', true).then((value) => {
            if (callback) callback(null, self.isTrue(value))
          })
        })

        .on('set', function (value, callback) {
          self.setValueForDataPointNameWithSettingsKey('active', value)
          callback()
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('active', (newValue) => {
        self.activeCharacteristic.updateValue(self.isTrue(newValue), null)
      })

      this.getHomeKitAccessory().setPrimaryService(this.motionSensor)
      this.motionSensor.addLinkedService(activeButton)
    }
  }

  initServiceSettings () {
    return {
      '*': {
        motion: 'MOTION',
        illumination: 'CURRENT_ILLUMINATION',
        active: 'MOTION_DETECTION_ACTIVE'
      }
    }
  }

  static channelTypes () {
    return ['MOTIONDETECTOR_TRANSCEIVER']
  }
}

module.exports = HomeMaticIPMotionAccessory
