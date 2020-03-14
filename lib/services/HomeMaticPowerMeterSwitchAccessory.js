
const path = require('path')
const HomeMaticPowerMeterAccessory = require(path.join(__dirname, 'HomeMaticPowerMeterAccessory.js'))

class HomeMaticPowerMeterSwitchAccessory extends HomeMaticPowerMeterAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this

    if (this.getDataPointNameFromSettings('switch')) {
      this.switchService = this.getService(Service.Outlet)

      this.isOnCharacteristic = this.switchService.getCharacteristic(Characteristic.On)

      this.isOnCharacteristic.on('get', function (callback) {
        self.getValueForDataPointNameWithSettingsKey('switch', true).then(value => {
          callback(null, self.isTrue(value))
        })
      })

      this.isOnCharacteristic.on('set', function (value, callback) {
        self.setValueForDataPointNameWithSettingsKey('switch', value)
        callback()
      })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('switch', (newValue) => {
        self.log.debug('[PMSWITCH] event state %s', newValue)
        self.isOnCharacteristic.updateValue(self.isTrue(newValue), null)
      })
    }
  }

  queryData () {
    super.queryData()
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.refreshTimer)
    clearTimeout(this.initialQueryTimer)
  }

  initServiceSettings () {
    return {
      '*': {
        switch: '1.STATE',
        power: 'POWER',
        current: 'CURRENT',
        voltage: 'VOLTAGE',
        frequency: 'FREQUENCY',
        energyCounter: 'ENERGY_COUNTER'
      }
    }
  }

  static channelTypes () {
    return ['POWERMETER']
  }
}
module.exports = HomeMaticPowerMeterSwitchAccessory
