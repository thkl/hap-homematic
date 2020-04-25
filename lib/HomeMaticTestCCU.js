const path = require('path')
const HomeMaticCCU = require(path.join(__dirname, 'HomeMaticCCU.js'))

class HomeMaticTestCCU extends HomeMaticCCU {
  constructor (log, configuration) {
    super(log, configuration)
    this.log.debug('[TestCCU] init dummy CCU')
    this.dummyValues = {}
  }

  init () {

  }

  setDummyDevices (devices) {
    let self = this
    this.devices = devices
    // loop thru devices and add the interfaces used
    this.devices.map(device => {
      let ifNum = device.intf
      if (!self.interfaces[ifNum]) {
        self.interfaces[ifNum] = {
          inUse: false,
          name: device.intfName
        }
      }
    })
  }

  connect () {
    this.eventCallbacks = {}
  }

  hazDatapoint (dpName) {
    return new Promise((resolve, reject) => {
      resolve('true')
    })
  }

  setValue (address, newValue) {
    let self = this
    return new Promise((resolve, reject) => {
      self.dummyValues[address] = newValue
      resolve()
    })
  }

  getValue (address, ignoreCache = false) {
    let self = this
    return new Promise((resolve, reject) => {
      resolve(self.dummyValues[address])
    })
  }

  fireEvent (address, value) {
    this.dummyValues[address] = value
    super.fireEvent(address, value)
  }
}

module.exports = HomeMaticTestCCU
