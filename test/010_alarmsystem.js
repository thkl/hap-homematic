const assert = require('assert')
const path = require('path')
const Logger = require(path.join(__dirname, '..', 'lib', 'logger.js'))
const Server = require(path.join(__dirname, '..', 'lib', 'Server.js'))
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const expect = require('expect.js')

const fs = require('fs')
let log = new Logger('HAP Test')
log.setDebugEnabled()

const testCase = 'HM-Sec-Sir-WM.json'

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

  it('HAP-Homematic check ARMSTATE 0', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.5820259065ABCD:4.ARMSTATE', 0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.SecuritySystem, 'TestDevice', false, '', true)
    assert.ok(service, 'SecuritySystem Service not found')
    let chCur = service.getCharacteristic(Characteristic.SecuritySystemCurrentState)
    let chTar = service.getCharacteristic(Characteristic.SecuritySystemTargetState)
    assert.ok(chCur, 'SecuritySystemCurrentState Characteristics not found')
    assert.ok(chTar, 'SecuritySystemTargetState Characteristics not found')
    try {
      expect(chTar.value).to.be(Characteristic.SecuritySystemTargetState.STAY_ARM)
      expect(chCur.value).to.be(Characteristic.SecuritySystemCurrentState.STAY_ARM)
      done()
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic check ARMSTATE 1', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.5820259065ABCD:4.ARMSTATE', 1)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.SecuritySystem)
    let chCur = service.getCharacteristic(Characteristic.SecuritySystemCurrentState)
    let chTar = service.getCharacteristic(Characteristic.SecuritySystemTargetState)
    try {
      expect(chTar.value).to.be(Characteristic.SecuritySystemTargetState.NIGHT_ARM)
      expect(chCur.value).to.be(Characteristic.SecuritySystemCurrentState.STAY_ARM) // we have to wait 100ms
      setTimeout(() => {
        expect(chCur.value).to.be(Characteristic.SecuritySystemCurrentState.NIGHT_ARM)
        done()
      }, 110)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic check ARMSTATE 2', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.5820259065ABCD:4.ARMSTATE', 2)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.SecuritySystem)
    let chCur = service.getCharacteristic(Characteristic.SecuritySystemCurrentState)
    let chTar = service.getCharacteristic(Characteristic.SecuritySystemTargetState)
    try {
      expect(chTar.value).to.be(Characteristic.SecuritySystemTargetState.AWAY_ARM)
      expect(chCur.value).to.be(Characteristic.SecuritySystemCurrentState.NIGHT_ARM) // we have to wait 100ms
      setTimeout(() => {
        expect(chCur.value).to.be(Characteristic.SecuritySystemCurrentState.AWAY_ARM)
        done()
      }, 110)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic check ARMSTATE 3', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.5820259065ABCD:4.ARMSTATE', 3)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.SecuritySystem)
    let chCur = service.getCharacteristic(Characteristic.SecuritySystemCurrentState)
    let chTar = service.getCharacteristic(Characteristic.SecuritySystemTargetState)
    try {
      expect(chTar.value).to.be(Characteristic.SecuritySystemTargetState.DISARM)
      expect(chCur.value).to.be(Characteristic.SecuritySystemCurrentState.AWAY_ARM) // we have to wait 100ms
      setTimeout(() => {
        expect(chCur.value).to.be(Characteristic.SecuritySystemCurrentState.DISARMED)
        done()
      }, 110)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic check alarm goes off', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.5820259065ABCD:3.STATE', true)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.SecuritySystem)
    let ch = service.getCharacteristic(Characteristic.SecuritySystemCurrentState)
    try {
      expect(ch.value).to.be(Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED)
      done()
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic check HomeKit Switch Alarm Off', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.SecuritySystem)
    let ch = service.getCharacteristic(Characteristic.SecuritySystemTargetState)
    ch.emit('set', Characteristic.SecuritySystemTargetState.DISARM, async () => {
      let value = await that.server._ccu.getValue('BidCos-RF.5820259065ABCD:4.ARMSTATE')
      try {
        expect(parseInt(value)).to.be(3)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
