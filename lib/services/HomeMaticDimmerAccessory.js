const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticDimmerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.oldLevel = 1
    this.log.debug('[DIMMER] creating Service')
    let lightBulbService = this.getService(Service.Lightbulb)

    this.isOnCharacteristic = lightBulbService.getCharacteristic(Characteristic.On)

      .on('get', function (callback) {
        self.getValue('LEVEL').then(value => {
          callback(null, parseFloat(value) > 0)
        })
      })

      .on('set', function (value, callback) {
        self.log.debug('[Dimmer] set ON %s', value)
        self.isWorking = true

        if (value === false) {
          self.setValue('LEVEL', 0)
        } else {
          if (self.oldLevel === 0) {
            self.oldLevel = 1
          }
          self.setValue('LEVEL', self.oldLevel)
        }

        callback()
      })

    this.isOnCharacteristic.eventEnabled = true

    this.brightnessCharacteristic = lightBulbService.addCharacteristic(Characteristic.Brightness)

      .on('get', function (callback) {
        self.getValue('LEVEL').then(value => {
          callback(null, parseFloat(value) * 100)
        })
      })

      .on('set', function (value, callback) {
        let hkvalue = parseFloat(value) / 100
        clearTimeout(self.timer)
        self.timer = setTimeout(() => {
          self.log.debug('[Dimmer] set bn %s', hkvalue)
          self.isWorking = true
          self.setValue('LEVEL', hkvalue).then(() => {
            self.oldLevel = hkvalue
          })
        }, 500)
        if (callback) {
          callback()
        }
      })

    this.brightnessCharacteristic.eventEnabled = true

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('WORKING'), function (newValue) {
      self.isWorking = self.isTrue(newValue)
      if (!self.isWorking) {
        // make a final call
        self.getValue('LEVEL', true)
      }
    })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('LEVEL'), function (newValue) {
      self.log.debug('[DIMMER] event Level %s', parseFloat(newValue))
      if (self.isWorking !== true) {
        let lvl = parseFloat(newValue) * 100
        if (lvl === 0) {
          self.isOnCharacteristic.updateValue(false, null)
        } else {
          self.isOnCharacteristic.updateValue(true, null)
        }
        self.brightnessCharacteristic.updateValue(lvl, null)
      }
    })
  }

  shutdown () {
    clearTimeout(this.timer)
  }

  static channelTypes () {
    return ['DIMMER']
  }
}

module.exports = HomeMaticDimmerAccessory
