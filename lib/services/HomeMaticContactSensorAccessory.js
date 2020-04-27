
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
    let settings = this.getDeviceSettings()
    this.reverse = (settings.reverse !== undefined) ? settings.reverse : false

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
      .on('get', async (callback) => {
        // Ask CCU for datepoint value
        let value = await self.getValueForDataPointNameWithSettingsKey('state', null, false)
        // map this with settings
        let mappedValue = self.getDataPointResultMapping('state', null, value)
        if (callback) {
          callback(null, mappedValue)
        }
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', null, (newValue) => {
      let mappedValue = self.getDataPointResultMapping('state', null, newValue)
      let historyValue = self.getDataPointResultMapping('state', null, newValue, 'history')
      self.log.debug('[Contact] state Event %s -  mapped %s', newValue, mappedValue)

      if ((self.initialQuery === false) && (self.lastValue !== mappedValue)) {
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

      self.addLogEntry({
        status: historyValue
      })
      self.initialQuery = false
      self.lastValue = mappedValue
      self.state.updateValue(mappedValue, null)
    })

    // this.addTamperedCharacteristic(this.contact) // Prevent eve from hiding this
    this.addLowBatCharacteristic(this.contact)
  }

  initServiceSettings () {
    return {
      '*': {
        state: {name: 'STATE', boolean: true, mapping: {true: 1, false: 0}, history: {true: 1, false: 0}}
      }
    }
  }

  static channelTypes () {
    return ['CONTACT', 'SHUTTER_CONTACT', 'TILT_SENSOR']
  }

  static configurationItems () {
    return {
      'reverse': {
        type: 'checkbox',
        default: false,
        label: 'Reverse the values',
        hint: 'on is off and off is on'
      }
    }
  }
}
module.exports = HomeMaticContactSensorAccessory
