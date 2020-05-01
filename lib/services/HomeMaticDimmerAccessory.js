const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticDimmerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.oldLevel = 1
    this.log.debug('[DIMMER] creating Service')
    this.lightBulbService = this.getService(Service.Lightbulb)

    this.isOnCharacteristic = this.lightBulbService.getCharacteristic(Characteristic.On)

      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
        callback(null, parseFloat(value) > 0)
      })

      .on('set', (value, callback) => {
        self.log.debug('[Dimmer] set ON %s', value)
        self.isWorking = true

        if (value === false) {
          self.setValueForDataPointNameWithSettingsKey('level', null, 0)
        } else {
          if (self.oldLevel === 0) {
            self.oldLevel = 1
          }
          self.setValueForDataPointNameWithSettingsKey('level', null, self.oldLevel)
        }

        callback()
      })

    this.isOnCharacteristic.eventEnabled = true

    this.brightnessCharacteristic = this.lightBulbService.addCharacteristic(Characteristic.Brightness)

      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
        callback(null, parseFloat(value) * 100)
      })

      .on('set', (value, callback) => {
        let hkvalue = parseFloat(value) / 100
        clearTimeout(self.timer)
        self.timer = setTimeout(async () => {
          self.log.debug('[Dimmer] set bn %s', hkvalue)
          self.isWorking = true
          await self.setValueForDataPointNameWithSettingsKey('level', null, hkvalue)
          self.oldLevel = hkvalue
        }, 500)
        if (callback) {
          callback()
        }
      })

    this.brightnessCharacteristic.eventEnabled = true

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('working', null, (newValue) => {
      self.isWorking = self.isTrue(newValue)
      if (!self.isWorking) {
        // make a final call
        self.getValueForDataPointNameWithSettingsKey('level', null, true)
      }
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('level', null, (newValue) => {
      self.log.debug('[DIMMER] event Level %s', parseFloat(newValue))
      if (self.isWorking !== true) {
        let lvl = parseFloat(newValue) * 100
        if (lvl === 0) {
          self.isOnCharacteristic.updateValue(false, null)
        } else {
          self.isOnCharacteristic.updateValue(true, null)
        }
        self.log.debug('[DIMMER] update brightnessCharacteristic to  %s', lvl)
        self.brightnessCharacteristic.updateValue(lvl, null)
      }
    })
  }

  shutdown () {
    clearTimeout(this.timer)
  }

  initServiceSettings () {
    return {
      'DIMMER': {
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'}
      },
      'VIRTUAL_DIMMER': {
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'}
      },
      'DIMMER_VIRTUAL_RECEIVER': {
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'}
      }
    }
  }

  static channelTypes () {
    return ['DIMMER', 'VIRTUAL_DIMMER', 'DIMMER_VIRTUAL_RECEIVER']
  }
}

module.exports = HomeMaticDimmerAccessory
