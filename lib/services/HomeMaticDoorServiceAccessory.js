
// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))
const moment = require('moment')

class HomeMaticDoorServiceAccessory extends HomeMaticAccessory {
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

    this.door = this.getService(Service.Door)

    // Enable all Eve Logging Services for this device
    this.enableLoggingService('door', false)

    // enable the last Opened Service
    this.addLastActivationService(this.door)

    this.addResetStatistics(this.door, () => {
      self.log.debug('[Contact] reset Stats')
      if (self.tOC !== undefined) {
        self.timesOpened = 0
        self.savePersistentValue('timesOpened', self.timesOpened)
        self.tOC.updateValue(self.timesOpened, null)
      }
    })

    this.tOC = this.addStateBasedCharacteristic(this.door, this.eve.Characteristic.TimesOpened, () => {
      return self.timesOpened
    })

    this.oDC = this.addStateBasedCharacteristic(this.door, this.eve.Characteristic.OpenDuration, () => {
      return self.timeOpen
    })

    this.cDC = this.addStateBasedCharacteristic(this.door, this.eve.Characteristic.ClosedDuration, () => {
      return self.timeClosed
    })

    this.currentDoorState = this.door.getCharacteristic(Characteristic.CurrentPosition)
      .on('get', function (callback) {
        self.getValueForDataPointNameWithSettingsKey('state', true).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('state', value) ? 100 : 0)
          }
        })
      })

    this.targetDoorState = this.door.getCharacteristic(Characteristic.TargetPosition)
      .on('get', function (callback) {
        self.getValueForDataPointNameWithSettingsKey('state', true).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('state', value) ? 100 : 0)
          }
        })
      })
      .on('set', function (value, callback) {
        // This is just a sensor so reset homekit data to ccu value after 1 second playtime
        setTimeout(function () {
          self.getValueForDataPointNameWithSettingsKey('state', true).then(value => {
            self.processDoorState(value)
          })
        }, 1000)

        if (callback) {
          callback()
        }
      })

    this.positionDoorState = this.door.getCharacteristic(Characteristic.PositionState)
    this.positionDoorState.on('get', function (callback) {
      if (callback) callback(null, Characteristic.PositionState.STOPPED)
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', (newValue) => {
      if ((self.initialQuery === false) && (self.lastValue !== newValue)) {
        self.addLogEntry({
          status: self.getDataPointResultMapping('state', newValue) ? 1 : 0
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
      self.processDoorState(newValue)
    })
  }

  processDoorState (isOpen) {
    if ((this.currentDoorState !== undefined) && (this.targetDoorState !== undefined) && (this.positionDoorState !== undefined)) {
      switch (this.isTrue(isOpen)) {
        case false:
          this.currentDoorState.updateValue(0, null)
          this.targetDoorState.updateValue(0, null)
          this.positionDoorState.updateValue(2, null)
          break
        case true:
          this.currentDoorState.updateValue(100, null)
          this.targetDoorState.updateValue(100, null)
          this.positionDoorState.updateValue(2, null)
          break
      }
    }
  }

  initServiceSettings () {
    return {
      '*': {
        state: {name: 'STATE', boolean: true, mapping: {true: true, false: false}}
      }
    }
  }

  static channelTypes () {
    return ['CONTACT']
  }
}
module.exports = HomeMaticDoorServiceAccessory
