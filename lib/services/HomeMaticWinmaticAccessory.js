// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticWinmaticAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
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
        if (value === 0) {
        // Lock Window on Close Event
          self.log.info('[WinMatic] set to 0 -> should lock')
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
        var hcvalue = 0
        hcvalue = dir
        // may there are some mappings needed
        // D = 0
        // i = 1
        // s = 2

        if (callback) callback(null, hcvalue)
      })

    this.position.eventEnabled = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('WORKING'), async (newValue) => {
      if (self.isTrue(newValue)) {
        if (self.shouldLock === true) {
          // set level to -0.005
          self.shouldLock = false
          await self.setValue('SPEED', 1)
          self.setValue('LEVEL', -0.005)
        }
      }
      self.getValue('LEVEL', true)
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('LEVEL'), (newValue) => {
      let lvl = parseFloat(newValue)
      let value = lvl * 100
      if (lvl === -0.005) {
        value = 0
      }
      self.currentPosition.updateValue(value, null)
      self.targetPosition.updateValue(value, null)
      self.position.updateValue(2, null)
    })
  }

  static channelTypes () {
    return ['WINMATIC']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticWinmaticAccessory
