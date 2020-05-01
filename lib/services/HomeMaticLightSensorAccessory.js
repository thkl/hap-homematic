const path = require('path')
const HomeMaticMotionAccessory = require(path.join(__dirname, 'HomeMaticMotionAccessory.js'))

class HomeMaticLightSensorAccessory extends HomeMaticMotionAccessory {
  initServiceSettings () {
    return {
      'LUXMETER': {
        illumination: 'LUX'
      },
      'BRIGHTNESS_TRANSMITTER': {
        illumination: 'CURRENT_ILLUMINATION'
      }
    }
  }
  static channelTypes () {
    return ['LUXMETER', 'BRIGHTNESS_TRANSMITTER']
  }

  static serviceDescription () {
    return 'This service provides a light sensor in HomeKit'
  }
}

module.exports = HomeMaticLightSensorAccessory
