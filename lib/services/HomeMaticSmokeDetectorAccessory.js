
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSmokeDetectorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let sensor = this.addService(new Service.SmokeSensor(this._name))
    this.detectorstate = sensor.getCharacteristic(Characteristic.SmokeDetected)
      .on('get', (callback) => {
        self.getValue('STATE', true).then((value) => {
          if (callback) callback(null, self.isTrue(value))
        })
      })
    this.detectorstate.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      self.log.debug('[SDS] event %s', newValue)
      self.detectorstate.updateValue(self.isTrue(newValue), null)
    })

    // This one haz LOWBAt on channel 1
    if ((this._deviceType === 'HM-Sec-SD-2') || (this._deviceType === 'HM-Sec-SD-2-Generic')) {
      this.addLowBatCharacteristic(sensor, 1)

      this.addFaultCharacteristic(sensor, '1:ERROR_SMOKE_CHAMBER', (value) => {
        return (parseInt(value) === 1)
      })
    }
  }

  static channelTypes () {
    return [
      'HM-Sec-SD:SMOKE_DETECTOR',
      'HM-Sec-SD-Generic:SMOKE_DETECTOR',
      'HM-Sec-SD-2:SMOKE_DETECTOR',
      'HM-Sec-SD-2-Generic:SMOKE_DETECTOR',
      'SMOKE_DETECTOR_TEAM',
      'SMOKE_DETECTOR_TEAM_V2']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticSmokeDetectorAccessory
