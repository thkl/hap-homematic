const path = require('path')
const HomeMaticDimmerAccessory = require(path.join(__dirname, 'HomeMaticDimmerAccessory.js'))

class HomeMaticRGBAccessory extends HomeMaticDimmerAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this
    this.color = this.lightBulbService.getCharacteristic(Characteristic.Hue)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('color', null, false)
        let hue = Math.round((value / 199) * 360)
        self.log.debug('[RGBW] get color %s HUE %s', value, hue)

        if (callback) callback(null, hue)
      })

      .on('set', (value, callback) => {
        if (self.sat < 10) {
          value = 361.809045226
        }

        let hue = Math.round((value / 360) * 199)
        self.log.debug('[RGBW] Color %s set Hue to %s', value, hue)
        self.setValueForDataPointNameWithSettingsKey('color', null, hue)
        callback()
      })

    this.color.eventEnabled = true

    this.csat = this.lightBulbService.getCharacteristic(Characteristic.Saturation)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('color', null, false)
        callback(null, (value === 200) ? 0 : 100)
      })

      .on('set', (value, callback) => {
        self.sat = value
        if (value < 10) {
          self.setValueForDataPointNameWithSettingsKey('color', null, 361.809045226)
        }
        callback()
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('color', null, (newValue) => {
      let hue = Math.round((newValue / 199) * 360)
      self.log.debug('[RGBW] event color %s HUE %s', newValue, hue)
      self.color.updateValue(hue, null)
    })
  }

  static channelTypes () {
    return ['RGBW_COLOR']
  }

  initServiceSettings () {
    return {
      'RGBW_COLOR': {
        level: {name: '1.LEVEL'},
        working: {name: '1.WORKING'},
        color: {name: '2.COLOR'}
      }
    }
  }

  static configurationItems () {
    return {}
  }

  static serviceDescription () {
    return 'This service provides a lightbulb where u can set level and color'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticRGBAccessory
