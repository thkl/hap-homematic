// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticDummyAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
  }
}
module.exports = HomeMaticDummyAccessory
