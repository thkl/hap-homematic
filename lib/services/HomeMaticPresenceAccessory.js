const path = require('path')
const HomeMaticIPMotionAccessory = require(path.join(__dirname, 'HomeMaticIPMotionAccessory.js'))

class HomeMaticPresenceAccessory extends HomeMaticIPMotionAccessory {
  initServiceSettings () {
    return {
      '*': {
        motion: 'PRESENCE_DETECTION_STATE',
        illumination: 'CURRENT_ILLUMINATION',
        active: 'PRESENCE_DETECTION_ACTIVE'
      }
    }
  }
  static channelTypes () {
    return ['PRESENCEDETECTOR_TRANSCEIVER']
  }
}

module.exports = HomeMaticPresenceAccessory
