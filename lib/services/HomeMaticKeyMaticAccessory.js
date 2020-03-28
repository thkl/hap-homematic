const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticKeyMaticAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.LockMechanism(this._name))

    this.lockCurrentState = service.getCharacteristic(Characteristic.LockCurrentState)
      .on('get', (callback) => {
        self.getValue('STATE', true).then((value) => {
          if (callback) callback(null, self.isTrue(value) ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED)
        })
      })
      .on('set', (value, callback) => {
        callback()
      })

    this.lockCurrentState.eventEnabled = true

    this.lockTargetState = service.getCharacteristic(Characteristic.LockTargetState)
      .on('get', function (callback) {
        self.getValue('STATE', true).then((value) => {
          if (callback) callback(null, self.isTrue(value) ? Characteristic.LockTargetState.UNSECURED : Characteristic.LockTargetState.SECURED)
        })
      })

      .on('set', function (value, callback) {
        clearTimeout(self.requeryTimer)
        self.setValue('STATE', (value === 1) ? 0 : 1).then(() => {})
        self.requeryTimer = setTimeout(function () {
          self.queryState()
        }, 10000)
        callback()
      })

    let dopener = service.addCharacteristic(Characteristic.TargetDoorState)
      .on('get', function (callback) {
        if (callback) callback(null, 1)
      })

      .on('set', function (value, callback) {
        if (value === 0) {
          self.setValue('OPEN', true).then(() => {})
          self.openTimer = setTimeout(function () {
            dopener.setValue(1, null)
          }, 2000)
        }
        callback()
      })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), function (newValue) {
      self.lockCurrentState.updateValue(self.isTrue(newValue) ? Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.SECURED, null)
      self.lockTargetState.updateValue(self.isTrue(newValue) ? Characteristic.LockTargetState.UNSECURED : Characteristic.LockTargetState.SECURED, null)
    })
  }

  queryState () {
    this.getValue('STATE', true) // should trigger the registered events
  }

  shutdown () {
    clearTimeout(this.openTimer)
    clearTimeout(this.requeryTimer)
    super.shutdown()
  }

  static channelTypes () {
    return ['KEYMATIC']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticKeyMaticAccessory
