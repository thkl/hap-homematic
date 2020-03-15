const path = require('path')
const HomeMaticDoorAccessory = require(path.join(__dirname, 'HomeMaticDoorAccessory.js'))

class HomeMaticWindowAccessory extends HomeMaticDoorAccessory {
  initAccessoryService (Service) {
    this.service = this.getService(Service.Window)
  }

  static channelTypes () {
    return ['CONTACT', 'SHUTTER_CONTACT']
  }
}
module.exports = HomeMaticWindowAccessory
