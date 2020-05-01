const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))
const moment = require('moment')

class HomeMaticGarageDoorOpenerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.GarageDoorOpener(this._name))

    // this is for eve history
    this.timesOpened = (this.getPersistentValue('timesOpened', 0))
    this.timeOpen = this.getPersistentValue('timeOpen', 0)
    this.timeClosed = this.getPersistentValue('timeClosed', 0)
    this.initialQuery = true

    let obstacle = service.getCharacteristic(Characteristic.ObstructionDetected)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })

    obstacle.eventEnabled = true

    this.currentDoorState = service.getCharacteristic(Characteristic.CurrentDoorState)
      .on('get', (callback) => {
        self.getValue('DOOR_STATE', true).then((value) => {
          self.log.debug('[GOA]  ccu says door is %s', value)
          switch (parseInt(value)) {
            case 0:
              if (callback) callback(null, Characteristic.CurrentDoorState.CLOSED)
              break
            case 1:
            case 2:
            case 3:
              if (callback) callback(null, Characteristic.CurrentDoorState.OPEN)
              break
            default:
              break
          }
        })
        if (callback) callback(null, true)
      })
      .on('set', (value, callback) => {
        callback()
      })
    this.currentDoorState.eventEnabled = true

    this.targetDoorState = service.getCharacteristic(Characteristic.TargetDoorState)
      .on('set', (value, callback) => {
        self.log.debug('[GOA]  Homekit Door Command %s', value)

        switch (value) {
          case Characteristic.TargetDoorState.OPEN:
            self.log.debug('[GOA]  sent 1 to ccu ')
            self.setValue('DOOR_COMMAND', 1)
            break
          case Characteristic.TargetDoorState.CLOSED:
            self.log.debug('[GOA]  sent 3 to ccu ')
            self.setValue('DOOR_COMMAND', 3)
            break

          default:
            break
        }
      })
    this.targetDoorState.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('DOOR_STATE'), (newValue) => {
      var isOpen = false
      switch (parseInt(newValue)) {
        case 0:
          this.log.debug('[GOA] sent Closed to Homekit')
          this.currentDoorState.updateValue(this.characteristic.CurrentDoorState.CLOSED, null)
          this.targetDoorState.updateValue(this.characteristic.TargetDoorState.CLOSED, null)
          break
        case 1:
        case 2:
        case 3:
          this.log.debug('[GOA] sent open to Homekit')
          this.currentDoorState.updateValue(this.characteristic.CurrentDoorState.OPEN, null)
          this.targetDoorState.updateValue(this.characteristic.TargetDoorState.OPEN, null)
          isOpen = true
          break

        default:
          break
      }
      // this is eve History
      if ((self.initialQuery === false) && (self.lastValue !== isOpen)) {
        let now = moment().unix()
        if (isOpen === true) {
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
        status: isOpen
      })

      self.initialQuery = false
    })

    // Enable all Eve Logging Services for this device
    this.enableLoggingService('door', false)

    // enable the last Opened Service
    this.addLastActivationService(this.service)

    this.addResetStatistics(this.service, () => {
      self.log.debug('[GOA] reset Stats')
      if (self.tOC !== undefined) {
        self.timesOpened = 0
        self.savePersistentValue('timesOpened', self.timesOpened)
        self.tOC.updateValue(self.timesOpened, null)
      }
    })

    this.tOC = this.addStateBasedCharacteristic(this.service, this.eve.Characteristic.TimesOpened, () => {
      return self.timesOpened
    })

    this.oDC = this.addStateBasedCharacteristic(this.service, this.eve.Characteristic.OpenDuration, () => {
      return self.timeOpen
    })

    this.cDC = this.addStateBasedCharacteristic(this.service, this.eve.Characteristic.ClosedDuration, () => {
      return self.timeClosed
    })
  }

  static channelTypes () {
    return ['DOOR_RECEIVER']
  }

  static configurationItems () {
    return {}
  }

  static serviceDescription () {
    return 'This service provides a garage door opener in HomeKit'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticGarageDoorOpenerAccessory
