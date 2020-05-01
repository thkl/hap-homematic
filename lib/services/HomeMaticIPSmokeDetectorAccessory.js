
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticIPSmokeDetectorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let settings = this.getDeviceSettings()
    this.memyselfandi = settings.single_alarm || false

    let sensor = this.addService(new Service.SmokeSensor(this._name))
    this.detectorstate = sensor.getCharacteristic(Characteristic.SmokeDetected)
      .on('get', (callback) => {
        self.getValue('SMOKE_DETECTOR_ALARM_STATUS', true).then((value) => {
          switch (parseInt(value)) {
            case 0: // idle
              if (callback) callback(null, false)
              break
            case 1: // primary alarm
              if (callback) callback(null, true)
              break
            case 2: // INTRUSION_ALARM
              if (callback) callback(null, true)
              break
            case 3: // SECONDARY_ALARM only set if not a single signaling
              if (self.memyselfandi !== true) {
                if (callback) callback(null, true)
              } else {
                if (callback) callback(null, false)
              }
              break
            default:
              if (callback) callback(null, false)
              break
          }
        })
      })
    this.detectorstate.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('SMOKE_DETECTOR_ALARM_STATUS'), (newValue) => {
      self.log.debug('[IPSDS] event %s', newValue)
      switch (newValue) {
        case 0: // idle
          self.detectorstate.updateValue(false, null)
          break
        case 1: // primary alarm
          self.detectorstate.updateValue(true, null)
          break
        case 2: // INTRUSION_ALARM
          self.detectorstate.updateValue(true, null)
          break
        case 3: // SECONDARY_ALARM only set if not a single signaling
          if (self.memyselfandi !== true) {
            self.detectorstate.updateValue(true, null)
          }
          break
      }
    })

    // This one haz LOWBAt on channel 1
    if (this._deviceType === 'HmIP-SWSD') {
      this.addLowBatCharacteristic(sensor, 0)
    }
  }

  static channelTypes () {
    return ['HmIP-SWSD:SMOKE_DETECTOR']
  }

  static configurationItems () {
    return {
      'single_alarm': {
        type: 'checkbox',
        default: false,
        label: 'Detect single alarms',
        hint: ''
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a smoke detector in HomeKit'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticIPSmokeDetectorAccessory
