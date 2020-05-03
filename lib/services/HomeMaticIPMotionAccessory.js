const path = require('path')
const HomeMaticMotionAccessory = require(path.join(__dirname, 'HomeMaticMotionAccessory.js'))

class HomeMaticIPMotionAccessory extends HomeMaticMotionAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    super.publishServices(Service, Characteristic)
    let settings = this.getDeviceSettings()
    this.useActive = (settings.useActive) ? settings.useActive : false

    // add a optional Active Switch
    if (this.useActive) {
      if (this.getDataPointNameFromSettings('active', null) !== undefined) {
        this.motionSensor.addOptionalCharacteristic(Characteristic.On)
        this.activeCharacteristic = this.motionSensor.getCharacteristic(Characteristic.On)

          .on('get', (callback) => {
            self.getValueForDataPointNameWithSettingsKey('active', null, false).then((value) => {
              if (callback) callback(null, self.isTrue(value))
            })
          })

          .on('set', (value, callback) => {
            self.setValueForDataPointNameWithSettingsKey('active', null, value)
            callback()
          })

        this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('active', null, (newValue) => {
          self.activeCharacteristic.updateValue(self.isTrue(newValue), null)
        })
      }
    }

    this.addBatteryLevelStatus()
  }

  initServiceSettings () {
    return {
      '*': {
        motion: 'MOTION',
        illumination: 'ILLUMINATION',
        active: 'MOTION_DETECTION_ACTIVE'
      }
    }
  }

  static channelTypes () {
    return ['MOTIONDETECTOR_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a motion sensor in HomeKit'
  }

  static configurationItems () {
    return {
      'useActive': {
        type: 'checkbox',
        default: false,
        label: 'Add Active Switch',
        hint: 'adds a switch to turn the sensor on and off'
      }
    }
  }
}

module.exports = HomeMaticIPMotionAccessory
