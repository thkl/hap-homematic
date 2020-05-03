
const path = require('path')
const HomeMaticPowerMeterAccessory = require(path.join(__dirname, 'HomeMaticPowerMeterAccessory.js'))

class HomeMaticPowerMeterSwitchAccessory extends HomeMaticPowerMeterAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this
    let readOnly = this.isReadOnly()
    if (this.getDataPointNameFromSettings('switch', null)) {
      this.switchService = this.addService(new Service.Switch(this._name + ' On Off ', 'On Off'))
      this.isOnCharacteristic = this.switchService.getCharacteristic(Characteristic.On)
      this.isOnCharacteristic.on('get', async (callback) => {
        callback(null, self.isTrue(await self.getValueForDataPointNameWithSettingsKey('switch', null, true)))
      })

      this.isOnCharacteristic.on('set', (value, callback) => {
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
        self.addLogEntry({status: self.isTrue(newValue) ? 1 : 0})
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

  static serviceDescription () {
    return 'This service provides a enery counter with a switch actor in HomeKit (this only works in eve)'
  }

  static channelTypes () {
    return ['POWERMETER']
  }
}
module.exports = HomeMaticPowerMeterSwitchAccessory
