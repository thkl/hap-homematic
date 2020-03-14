const path = require('path')
const HomeMaticIPMotionAccessory = require(path.join(__dirname, 'HomeMaticIPMotionAccessory.js'))

class HomeMaticIPAccelerationAccessory extends HomeMaticIPMotionAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
  }

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
}

module.exports = HomeMaticIPAccelerationAccessory
