const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticMotionAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    if (this.getDataPointNameFromSettings('motion', null)) {
      this.motionSensor = this.getService(Service.MotionSensor)
      this.motionDetected = this.motionSensor.getCharacteristic(Characteristic.MotionDetected)
        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('motion', null, false).then((value) => {
            if (callback) callback(null, self.isTrue(value))
          })
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('motion', null, (newValue) => {
        self.motionDetected.updateValue(self.isTrue(newValue), null)
        self.addLogEntry({
          status: self.isTrue(newValue) ? 1 : 0
        })

        if (self.isTrue(newValue)) {
          self.updateLastActivation()
        }

        self.initialQuery = false
        self.lastValue = newValue
      })

      // Enable all Eve Logging Services for this device
      this.enableLoggingService('motion', false)
    } else {
      this.log.warn('[Motion] missing motion sensor settings for motion')
    }

    // Add a Brightness Sensor if the device haze one
    if (this.getDataPointNameFromSettings('illumination', null) !== undefined) {
      this.illuminationSensor = this.getService(Service.LightSensor)
      this.illuminationLevel = this.illuminationSensor.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('illumination', null, false).then((value) => {
            if (callback) callback(null, parseFloat(value))
          })
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('illumination', null, (newValue) => {
        self.illuminationLevel.updateValue(parseFloat(newValue), null)
      })

      this.motionSensor.addLinkedService(this.illuminationSensor)
    } else {
      this.log.warn('[Motion] missing motion sensor settings for illumination')
    }

    // enable the last Opened Service
    this.addLastActivationService(this.motionSensor)
    this.addTamperedCharacteristic(this.motionSensor)
    this.addLowBatCharacteristic(this.motionSensor)
  }

  initServiceSettings () {
    return {
      '*': {
        motion: 'MOTION',
        illumination: 'BRIGHTNESS'
      }
    }
  }

  static channelTypes () {
    return ['MOTION_DETECTOR']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticMotionAccessory
