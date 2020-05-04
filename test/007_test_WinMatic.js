const assert = require('assert')
const path = require('path')
const Logger = require(path.join(__dirname, '..', 'lib', 'logger.js'))
const Server = require(path.join(__dirname, '..', 'lib', 'Server.js'))
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const expect = require('expect.js')

const fs = require('fs')
let log = new Logger('HAP Test')
log.setDebugEnabled(false)

const testCase = 'HM-Sec-Win.json'

describe('HAP-Homematic Tests ' + testCase, () => {
  let that = this

  before(async () => {
    log.debug('preparing tests')
    let datapath = path.join(__dirname, 'devices', testCase)
    let strData = fs.readFileSync(datapath).toString()
    if (strData) {
      that.data = JSON.parse(strData)

      that.server = new Server(log)

      await that.server.simulate(undefined, {config: {
        channels: Object.keys(that.data.ccu)
      },
      devices: that.data.devices})
    } else {
      assert.ok(false, 'Unable to load Test data')
    }
  })

  after(() => {
    Object.keys(that.server._publishedAccessories).map(key => {
      let accessory = that.server._publishedAccessories[key]
      accessory.shutdown()
    })
  })

  it('HAP-Homematic check test mode', (done) => {
    expect(that.server.isTestMode).to.be(true)
    done()
  })

  it('HAP-Homematic check number of ccu devices', (done) => {
    expect(that.server._ccu.getCCUDevices().length).to.be(1)
    done()
  })

  it('HAP-Homematic check number of mappend devices', (done) => {
    expect(Object.keys(that.server._publishedAccessories).length).to.be(1)
    done()
  })

  it('HAP-Homematic check assigned services', (done) => {
    Object.keys(that.server._publishedAccessories).map(key => {
      let accessory = that.server._publishedAccessories[key]
      expect(accessory.serviceClass).to.be(that.data.ccu[accessory.address()])
    })
    done()
  })

  it('HAP-Homematic check LEVEL 0 Cur Tar Pos sould be 0', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.LEVEL', 0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Window)
    assert.ok(service, 'Window Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentPosition)
    assert.ok(ch, 'CurrentPosition State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(0)
      } catch (e) {
        done(e)
      }
    })
    let ch1 = service.getCharacteristic(Characteristic.TargetPosition)
    assert.ok(ch1, 'TargetPosition State Characteristics not found')
    ch1.getValue((context, value) => {
      try {
        expect(value).to.be(0)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check running window - fire level 50%', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.WORKING', true)
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.LEVEL', 0.5)
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.DIRECTION', 1)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Window)
    let curPos = service.getCharacteristic(Characteristic.CurrentPosition)
    let tarPos = service.getCharacteristic(Characteristic.TargetPosition)
    let state = service.getCharacteristic(Characteristic.PositionState)
    // do not get the value cause we want to use the event
    try {
      expect(tarPos.value).to.be(50)
      expect(state.value).to.be(Characteristic.PositionState.INCREASING)
      // we have to wait cause the service sets current 200ms after the target position
      setTimeout(() => {
        expect(tarPos.value).to.be(50)
        done()
      }, 250)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic check running window done (100%) Working still not false', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.WORKING', true)
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.LEVEL', 1)
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.DIRECTION', 1)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Window)
    let curPos = service.getCharacteristic(Characteristic.CurrentPosition)
    let tarPos = service.getCharacteristic(Characteristic.TargetPosition)
    let state = service.getCharacteristic(Characteristic.PositionState)

    // do not get the value cause we want to use the event
    try {
      expect(tarPos.value).to.be(100)
      expect(state.value).to.be(Characteristic.PositionState.INCREASING)
      // we have to wait cause the service sets current 200ms after the target position
      setTimeout(() => {
        expect(curPos.value).to.be(100)
        done()
      }, 250)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic requery window state by homekit (should be also 100)', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Window)
    let curPos = service.getCharacteristic(Characteristic.CurrentPosition)
    let tarPos = service.getCharacteristic(Characteristic.TargetPosition)
    curPos.getValue((context, value) => {
      try {
        expect(value).to.be(100)
      } catch (e) {
        done(e)
      }
    })
    tarPos.getValue((context, value) => {
      try {
        expect(value).to.be(100)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check running window done with working false', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.LEVEL', 1)
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.DIRECTION', 1)
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.WORKING', false)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Window)
    let curPos = service.getCharacteristic(Characteristic.CurrentPosition)
    let tarPos = service.getCharacteristic(Characteristic.TargetPosition)
    let state = service.getCharacteristic(Characteristic.PositionState)

    // do not get the value cause we want to use the event
    try {
      expect(tarPos.value).to.be(100)
      expect(state.value).to.be(Characteristic.PositionState.STOPPED)
      setTimeout(() => {
        expect(curPos.value).to.be(100)
        done()
      }, 250)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic set HomeKit to close 10%', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Window)
    let ch = service.getCharacteristic(Characteristic.TargetPosition)
    ch.emit('set', 10, () => {
      // we have to wait 500ms set WM is delayed by 500ms
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('BidCos-RF.1123456789ABCD:1.LEVEL')
        try {
          expect(value).to.be(0.1)
          done()
        } catch (e) {
          done(e)
        }
      }, 550)
    })
  })

  it('HAP-Homematic set HomeKit to close 0 HM should lock', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Window)
    let ch = service.getCharacteristic(Characteristic.TargetPosition)
    ch.emit('set', 0, () => {
      // we have to wait 500ms set WM is delayed by 500ms
      setTimeout(() => {
        that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:1.WORKING', false)
        setTimeout(async () => {
          let value = await that.server._ccu.getValue('BidCos-RF.1123456789ABCD:1.LEVEL')
          try {
            expect(value).to.be(-0.005)
            done()
          } catch (e) {
            done(e)
          }
        }, 100)
      }, 550)
    })
  })

  it('HAP-Homematic Test AKKU 100%', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:2.LEVEL', 1)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.BatteryService)
    let lvl = service.getCharacteristic(Characteristic.BatteryLevel)
    let lowLvl = service.getCharacteristic(Characteristic.StatusLowBattery)
    try {
      expect(lvl.value).to.be(100)
      expect(lowLvl.value).to.be(Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL)
      done()
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic Test AKKU 19% LOW Level', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:2.LEVEL', 0.19)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.BatteryService)
    let lvl = service.getCharacteristic(Characteristic.BatteryLevel)
    let lowLvl = service.getCharacteristic(Characteristic.StatusLowBattery)
    try {
      expect(lvl.value).to.be(19)
      expect(lowLvl.value).to.be(Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW)
      done()
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic Test AKKU Charging', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.1123456789ABCD:2.STATUS', 1)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.BatteryService)
    let chrg = service.getCharacteristic(Characteristic.ChargingState)
    try {
      expect(chrg.value).to.be(Characteristic.ChargingState.CHARGING)
      done()
    } catch (e) {
      done(e)
    }
  })
})
