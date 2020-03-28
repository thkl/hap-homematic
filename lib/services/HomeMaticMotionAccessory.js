const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticMotionAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    if (this.getDataPointNameFromSettings('motion', null)) {
      this.motionSensor = this.addService(new Service.MotionSensor(this._name, 'Motion'))
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
    }

    // Add a Brightness Sensor if the device haze one
    if (this.getDataPointNameFromSettings('illumination', null) !== undefined) {
      this.illuminationSensor = this.addService(new Service.LightSensor(this._name + ' Illumination', 'Illumination'))

      this.illuminationLevel = this.illuminationSensor.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('illumination', null, false).then((value) => {
            if (callback) callback(null, parseFloat(value))
          })
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('illumination', null, (newValue) => {
        self.illuminationLevel.updateValue(parseFloat(newValue), null)
      })
      if (this.motionSensor) {
        this.motionSensor.addLinkedService(this.illuminationSensor)
      }
    }
    if (this.motionSensor) {
      this.homeKitAccessory.setPrimaryService(this.motionSensor)
    }
    // enable the last Opened Service
    this.addLastActivationService(this.motionSensor)
    this.addTamperedCharacteristic(this.motionSensor)
    if (this._ccuType === 'MOTION_DETECTOR') {
      this.addLowBatCharacteristic(this.motionSensor)
    }
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
