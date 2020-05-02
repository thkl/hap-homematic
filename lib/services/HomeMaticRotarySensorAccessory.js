
const path = require('path')
const HomeMaticContactSensorAccessory = require(path.join(__dirname, 'HomeMaticContactSensorAccessory.js'))

class HomeMaticRotarySensorAccessory extends HomeMaticContactSensorAccessory {
  initServiceSettings () {
    return {
      '*': {
        state: {name: 'STATE', number: true, mapping: {1: true, 2: true, 0: false}, history: {1: 1, 2: 1, 0: 0}}
      }
    }
  }

  static channelTypes () {
    return ['ROTARY_HANDLE_SENSOR', 'ROTARY_HANDLE_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a contact in HomeKit based on a rotary sensor from your ccu'
  }
}
module.exports = HomeMaticRotarySensorAccessory
