const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticIPLeakSensorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    var self = this
    var leakSensor = this.getService(Service.LeakSensor)
    let evntType = this.getDeviceSettings().evntType || 'WATERLEVEL_DETECTED'

    this.state = leakSensor.getCharacteristic(Characteristic.LeakDetected)
      .on('get', (callback) => {
        self.getValue(evntType, false).then(value => {
          if (callback) {
            self.log.debug('[IPLSA] return status')
            callback(null, ((self.isTrue(value)) ? 1 : 0))
          }
        })
      })

    this.state.eventEnabled = true

    this.enableLoggingService('motion')
    this.addLastActivationService(leakSensor)

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress(evntType), (newValue) => {
      self.log.debug('[IPLSA] Leak State event %s', newValue)
      let leakDetected = (self.isTrue(newValue))
      if (leakDetected) {
        self.state.updateValue(1, null)
        self.updateLastActivation()
        self.addLogEntry({status: leakDetected ? 1 : 0})
      } else {
        self.state.updateValue(0, null)
      }
    })
  }

  static serviceDescription () {
    return 'This service provides a leak sensor in HomeKit'
  }

  static configurationItems () {
    return {
      'evntType': {
        type: 'option',
        array: ['MOISTURE_DETECTED', 'WATERLEVEL_DETECTED'],
        default: 'WATERLEVEL_DETECTED',
        label: 'Leak event',
        hint: 'on which event should the sensor fire a leak message'
      }
    }
  }

  static channelTypes () {
    return ['WATER_DETECTION_TRANSMITTER']
  }
}
module.exports = HomeMaticIPLeakSensorAccessory
