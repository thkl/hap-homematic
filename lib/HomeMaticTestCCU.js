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
    this.devices = devices
    // add the dummy Interface
    this.interfaces[0] = {
      inUse: false,
      name: 'Dummy'
    }
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
}

module.exports = HomeMaticTestCCU
