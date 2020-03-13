
// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))
const moment = require('moment')

class HomeMaticContactSensorAccessory extends HomeMaticAccessory {
  isTrue (value) {
    if (this.reverse === true) {
      return !super.isTrue(value)
    } else {
      return super.isTrue(value)
    }
  }

  publishServices (Service, Characteristic) {
    let self = this

    this.timesOpened = (this.getPersistentValue('timesOpened', 0))
    this.timeOpen = this.getPersistentValue('timeOpen', 0)
    this.timeClosed = this.getPersistentValue('timeClosed', 0)
    this.reverse = (this._settings.reverse !== undefined) ? this._settings.reverse : false

    this.contact = this.getService(Service.ContactSensor)

    // Enable all Eve Logging Services for this device
    this.enableLoggingService('door', false)

    // enable the last Opened Service
    this.addLastActivationService(this.contact)

    this.addResetStatistics(this.contact, () => {
      self.log.debug('[Contact] reset Stats')
      if (self.tOC !== undefined) {
        self.timesOpened = 0
        self.savePersistentValue('timesOpened', self.timesOpened)
        self.tOC.updateValue(self.timesOpened, null)
      }
    })

    this.tOC = this.addStateBasedCharacteristic(this.contact, this.eve.Characteristic.TimesOpened, () => {
      return self.timesOpened
    })

    this.oDC = this.addStateBasedCharacteristic(this.contact, this.eve.Characteristic.OpenDuration, () => {
      return self.timeOpen
    })

    this.cDC = this.addStateBasedCharacteristic(this.contact, this.eve.Characteristic.ClosedDuration, () => {
      return self.timeClosed
    })

    this.state = this.contact.getCharacteristic(Characteristic.ContactSensorState)
      .on('get', function (callback) {
        self.getValue('STATE', true).then(value => {
          if (callback) {
            callback(null, self.isTrue(value) ? 0 : 1)
          }
        })
      })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('STATE'), function (newValue) {
      if ((self.initialQuery === false) && (self.lastValue !== newValue)) {
        self.addLogEntry({
          status: self.isTrue(newValue) ? 1 : 0
        })
        let now = moment().unix()
        if (self.isTrue(newValue)) {
          self.timeClosed = self.timeClosed + (moment().unix() - self.timeStamp)
          self.timesOpened = self.timesOpened + 1
          self.tOC.updateValue(self.timesOpened, null)
          self.savePersistentValue('timesOpened', self.timesOpened)
          self.updateLastActivation()
          self.timeStamp = now
          self.oDC.updateValue(self.timeOpen)
        } else {
          self.timeOpen = self.timeOpen + (moment().unix() - self.timeStamp)
          self.cDC.updateValue(self.timeClosed)
        }
      }
      self.initialQuery = false
      self.lastValue = newValue
      self.state.updateValue(self.isTrue(newValue) ? 0 : 1, null)
    })
  }

  static channelTypes () {
    return ['CONTACT']
  }
}
module.exports = HomeMaticContactSensorAccessory
