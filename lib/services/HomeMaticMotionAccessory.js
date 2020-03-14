const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticMotionAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    if (this.getDataPointName('motion')) {
      this.motionSensor = this.getService(Service.MotionSensor)
      this.motionDetected = this.motionSensor.getCharacteristic(Characteristic.MotionDetected)
        .on('get', function (callback) {
          self.getValue(self.getDataPointName('motion'), true).then((value) => {
            if (callback) callback(null, self.isTrue(value))
          })
        })

      this.registeraddressForEventProcessingAtAccessory(this.buildAddress(self.getDataPointName('motion')), function (newValue) {
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
    if (this.getDataPointName('illumination') !== undefined) {
      this.illuminationSensor = this.getService(Service.LightSensor)
      this.illuminationLevel = this.illuminationSensor.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .on('get', function (callback) {
          self.getValue(self.getDataPointName('illumination'), true).then((value) => {
            if (callback) callback(null, parseFloat(value))
          })
        })

      this.registeraddressForEventProcessingAtAccessory(this.buildAddress(self.getDataPointName('illumination')), function (newValue) {
        self.illuminationLevel.updateValue(parseFloat(newValue), null)
      })

      this.motionSensor.addLinkedService(this.illuminationSensor)
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

  getDataPointName (type) {
    let result = this.deviceServiceSettings(type)
    this.log.debug('[Motion] settings :%s ', JSON.stringify(result))
    return result
  }

  static channelTypes () {
    return ['MOTION_DETECTOR']
  }

  configurationItems () {
    this.log.warn('[DUMMY] OVERRIDE THIS TO SPECIFY THE CONFIG ITEMS FOR THE SERVICE')
    return []
  }

  validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticMotionAccessory
