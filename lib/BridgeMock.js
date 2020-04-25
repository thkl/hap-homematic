const Accessory = require('hap-nodejs').Accessory

class MockAccessory extends Accessory {
  publish () {}
}

class BridgeMock extends MockAccessory {
  constructor (displayName, serialNumber) {
    super(displayName, serialNumber)
    this._isBridge = true
  }
}

module.exports = BridgeMock
