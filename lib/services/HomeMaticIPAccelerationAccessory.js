const path = require('path')
const HomeMaticIPMotionAccessory = require(path.join(__dirname, 'HomeMaticIPMotionAccessory.js'))

class HomeMaticIPAccelerationAccessory extends HomeMaticIPMotionAccessory {
  initServiceSettings () {
    return {
      '*': {
        motion: 'MOTION'
      }
    }
  }
  static channelTypes () {
    return ['ACCELERATION_TRANSCEIVER']
  }

  static serviceDescription () {
    return 'This service provides a motion sensor in HomeKit based on a acceleration device.'
  }
}

module.exports = HomeMaticIPAccelerationAccessory
