const path = require('path')
const HomeMaticDoorAccessory = require(path.join(__dirname, 'HomeMaticDoorAccessory.js'))

class HomeMaticWindowAccessory extends HomeMaticDoorAccessory {
  initAccessoryService (Service) {
    this.service = this.getService(Service.Window)
  }

  static channelTypes () {
    return ['CONTACT', 'SHUTTER_CONTACT']
  }

  static serviceDescription () {
    return 'This service provides a window device in HomeKit based on a ccu contact'
  }
}
module.exports = HomeMaticWindowAccessory
