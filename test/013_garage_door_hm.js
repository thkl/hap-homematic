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

const testCase = 'HmIP-MOD-HO.json'

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

  it('HAP-Homematic open the door', (done) => {
    that.server._ccu.fireEvent('HmIP.3123456789ABCD:1.DOOR_STATE', 3)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.GarageDoorOpener, 'TestDevice', false, '', true)
    assert.ok(service, 'GarageDoorOpener Service not found')
    let chCur = service.getCharacteristic(Characteristic.CurrentDoorState)
    let chTar = service.getCharacteristic(Characteristic.TargetDoorState)
    assert.ok(chCur, 'CurrentDoorState Characteristics not found')
    assert.ok(chTar, 'TargetDoorState Characteristics not found')
    try {
      expect(chTar.value).to.be(Characteristic.TargetDoorState.OPEN)
      setTimeout(() => {
        expect(chCur.value).to.be(Characteristic.CurrentDoorState.OPEN)
        done()
      }, 110)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic close the door', (done) => {
    that.server._ccu.fireEvent('HmIP.3123456789ABCD:1.DOOR_STATE', 0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.GarageDoorOpener)
    assert.ok(service, 'GarageDoorOpener Service not found')
    let chCur = service.getCharacteristic(Characteristic.CurrentDoorState)
    let chTar = service.getCharacteristic(Characteristic.TargetDoorState)
    assert.ok(chCur, 'CurrentDoorState Characteristics not found')
    assert.ok(chTar, 'TargetDoorState Characteristics not found')
    try {
      // it takes 100ms so the state should be the previous
      expect(chCur.value).to.be(Characteristic.CurrentDoorState.OPEN)
      expect(chTar.value).to.be(Characteristic.TargetDoorState.CLOSED)
      setTimeout(() => {
        expect(chCur.value).to.be(Characteristic.CurrentDoorState.CLOSED)
        done()
      }, 110)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic test hk close the door', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.GarageDoorOpener)
    let chTar = service.getCharacteristic(Characteristic.TargetDoorState)
    chTar.emit('set', Characteristic.TargetDoorState.CLOSED)
    try {
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('HmIP.3123456789ABCD:1.DOOR_COMMAND')
        expect(value).to.be(3)
        done()
      }, 10)
    } catch (e) {
      done(e)
    }
  })

  it('HAP-Homematic test hk open the door', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.GarageDoorOpener)
    let chTar = service.getCharacteristic(Characteristic.TargetDoorState)
    chTar.emit('set', Characteristic.TargetDoorState.OPEN)
    try {
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('HmIP.3123456789ABCD:1.DOOR_COMMAND')
        expect(value).to.be(1)
        done()
      }, 10)
    } catch (e) {
      done(e)
    }
  })
})
