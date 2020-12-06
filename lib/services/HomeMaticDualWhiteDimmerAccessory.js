const path = require('path')
const HomeMaticDimmerAccessory = require(path.join(__dirname, 'HomeMaticDimmerAccessory.js'))

class HomeMaticDualWhiteDimmerAccessory extends HomeMaticDimmerAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    super.publishServices(Service, Characteristic)

    this.colorCharacteristic = this.lightBulbService.getCharacteristic(Characteristic.ColorTemperature)
      .on('get', async (callback) => {
        let x = await self.getValueForDataPointNameWithSettingsKey('coltemp', null, true)
        let r = (parseFloat(x) * 360) + 140
        callback(null, r)
      })
      .on('set', async (value, callback) => {
        // Level is between 140 - 500
        let x = (parseFloat(value) - 140) / 360

        await self.setValueForDataPointNameWithSettingsKey('coltemp', null, x)
        if (callback) {
          callback()
        }
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('coltemp', null, (newValue) => {
      let r = (parseFloat(newValue) * 360) + 140
      self.updateCharacteristic(self.colorCharacteristic, r)
    })
  }

  static channelTypes () {
    return ['DUAL_WHITE_BRIGHTNESS']
  }

  initServiceSettings () {
    return {
      'DUAL_WHITE_BRIGHTNESS': {
        level: {name: '1.LEVEL'},
        coltemp: {name: '2.LEVEL'},
        working: {name: 'WORKING'},
        ramp: {name: 'RAMP_TIME'}
      }
    }
  }
}

module.exports = HomeMaticDualWhiteDimmerAccessory
