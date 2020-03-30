
const path = require('path')
const HomeMaticPowerMeterAccessory = require(path.join(__dirname, 'HomeMaticPowerMeterAccessory.js'))

class HomeMaticPowerMeterSwitchAccessory extends HomeMaticPowerMeterAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this
    let readOnly = this.isReadOnly()
    if (this.getDataPointNameFromSettings('switch', null)) {
      this.switchService = this.getService(Service.Outlet)

      this.isOnCharacteristic = this.switchService.getCharacteristic(Characteristic.On)

      this.isOnCharacteristic.on('get', function (callback) {
        self.getValueForDataPointNameWithSettingsKey('switch', null, true).then(value => {
          callback(null, self.isTrue(value))
        })
      })

      this.isOnCharacteristic.on('set', function (value, callback) {
        if (!readOnly) {
          self.setValueForDataPointNameWithSettingsKey('switch', null, value)
        } else {
          // check the state 1 sec later to reset the homekit state
          setTimeout(() => {
            self.getValueForDataPointNameWithSettingsKey('switch', null, true)
          }, 1000)
        }
        callback()
      })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('switch', null, (newValue) => {
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
        roChannel: 1,
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
