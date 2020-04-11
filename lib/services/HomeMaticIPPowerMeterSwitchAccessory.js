
const path = require('path')
const HomeMaticPowerMeterSwitchAccessory = require(path.join(__dirname, 'HomeMaticPowerMeterSwitchAccessory.js'))

class HomeMaticIPPowerMeterSwitchAccessory extends HomeMaticPowerMeterSwitchAccessory {
  initServiceSettings () {
    return {
      'HmIP-BSM:ENERGIE_METER_TRANSMITTER': {
        roChannel: 4,
        switch: '4.STATE',
        power: 'POWER',
        current: 'CURRENT',
        voltage: 'VOLTAGE',
        frequency: 'FREQUENCY',
        energyCounter: 'ENERGY_COUNTER'
      },
      '*': {
        roChannel: 3,
        switch: '3.STATE',
        power: 'POWER',
        current: 'CURRENT',
        voltage: 'VOLTAGE',
        frequency: 'FREQUENCY',
        energyCounter: 'ENERGY_COUNTER'
      }
    }
  }

  static channelTypes () {
    return ['ENERGIE_METER_TRANSMITTER']
  }
}
module.exports = HomeMaticIPPowerMeterSwitchAccessory
