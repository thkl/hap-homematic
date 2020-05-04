// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticWinmaticAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.setByHomeKit = false
    this.isWorking = false
    let service = this.addService(new Service.Window(this._name))
    this.currentPosition = service.getCharacteristic(Characteristic.CurrentPosition)
      .on('get', async (callback) => {
        let pos = self.getValue('LEVEL', true)
        let hkPos = pos * 100
        if (pos === -0.005) {
          hkPos = 0
        }
        if (callback) callback(null, hkPos)
      })
      .on('set', (value, callback) => {
        callback()
      })

    this.currentPosition.eventEnabled = true

    this.targetPosition = service.getCharacteristic(Characteristic.TargetPosition)
      .on('set', async (value, callback) => {
        self.setByHomeKit = true
        if (value === 0) {
        // Lock Window on Close Event
          self.log.debug('[WinMatic] set to 0 -> should lock')
          self.shouldLock = true
        }
        await self.setValue('SPEED', 1)
        self.setValueDelayed('LEVEL', (value / 100), 500)
        callback()
      })
      .on('get', async (callback) => {
        let pos = self.getValue('LEVEL', true)
        let hkPos = pos * 100
        if (pos === -0.005) {
          hkPos = 0
        }
        if (callback) callback(null, hkPos)
      })

    this.targetPosition.eventEnabled = true

    this.position = service.getCharacteristic(Characteristic.PositionState)
      .on('get', async (callback) => {
        let dir = await self.getValue('DIRECTION', true)
        switch (parseInt(dir)) {
          case 0:
            if (callback) callback(null, Characteristic.PositionState.STOPPED)
            break
          case 1:
            if (callback) callback(null, Characteristic.PositionState.INCREASING)
            break
          case 2:
            if (callback) callback(null, Characteristic.PositionState.DECREASING)
            break
        }
      })

    this.position.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('DIRECTION'), (newValue) => {
      switch (parseInt(newValue)) {
        case 0:
          this.position.updateValue(Characteristic.PositionState.STOPPED, null)
          break
        case 1:
          this.position.updateValue(Characteristic.PositionState.INCREASING, null)
          break
        case 2:
          this.position.updateValue(Characteristic.PositionState.DECREASING, null)
          break
      }
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('WORKING'), async (newValue) => {
      self.isWorking = self.isTrue(newValue)
      if (!self.isTrue(newValue)) {
        if (self.shouldLock === true) {
          // set level to -0.005
          self.shouldLock = false
          await self.setValue('SPEED', 1)
          await self.setValue('LEVEL', -0.005)
        }
        self.position.updateValue(Characteristic.PositionState.STOPPED, null)
        self.setByHomeKit = false
        self.getValue('LEVEL', true)
      }
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('LEVEL'), (newValue) => {
      let lvl = parseFloat(newValue)
      let value = lvl * 100
      if (lvl === -0.005) {
        value = 0
      }
      // do not touch the target position if the movement was initiated by homekit
      if (self.setByHomeKit === false) {
        self.targetPosition.updateValue(value, null)
      }
      setTimeout(() => {
        self.currentPosition.updateValue(value, null)
      }, 200)
    })
  }

  static channelTypes () {
    return ['WINMATIC']
  }

  static serviceDescription () {
    return 'This service provides a window device for HomeKit'
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticWinmaticAccessory
