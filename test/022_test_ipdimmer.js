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

const testCase = 'HmIP-BDT.json'

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
      devices: that.data.devices,
      mappings: that.data.mappings,
      values: { // add dummy values so hazDatapoint will find this DP and the device will get HMIP Style battery checks

      }
      })
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

  it('HAP-Homematic check LEVEL 0', (done) => {
    that.server._ccu.fireEvent('HmIP.6483408182ABCD:4.LEVEL', 0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Lightbulb)
    assert.ok(service, 'Lightbulb Service not found')
    let ch = service.getCharacteristic(Characteristic.Brightness)
    assert.ok(ch, 'Brightness Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(0)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check LEVEL 100', (done) => {
    that.server._ccu.fireEvent('HmIP.6483408182ABCD:4.LEVEL', 1)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Lightbulb)
    assert.ok(service, 'Lightbulb Service not found')
    let ch = service.getCharacteristic(Characteristic.Brightness)
    assert.ok(ch, 'Brightness Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(100)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check LEVEL 50%', (done) => {
    that.server._ccu.fireEvent('HmIP.6483408182ABCD:4.LEVEL', 0.5)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Lightbulb)
    assert.ok(service, 'Lightbulb Service not found')
    let ch = service.getCharacteristic(Characteristic.Brightness)
    assert.ok(ch, 'Brightness Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(50)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic set LEVEL 25%', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    accessory.delayOnSet = 10
    let service = accessory.getService(Service.Lightbulb)
    assert.ok(service, 'Lightbulb not found')
    let chTar = service.getCharacteristic(Characteristic.Brightness)
    chTar.setValue(25, () => {
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('HmIP.6483408182ABCD:4.LEVEL')
        try {
          expect(value).to.be(0.25)
          done()
        } catch (e) {
          done(e)
        }
      }, 15) // default delay is 500ms
    })
  })

  it('HAP-Homematic set LEVEL 100%', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    accessory.delayOnSet = 10
    let service = accessory.getService(Service.Lightbulb)
    assert.ok(service, 'Lightbulb not found')
    let chTar = service.getCharacteristic(Characteristic.Brightness)
    chTar.setValue(100, () => {
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('HmIP.6483408182ABCD:4.LEVEL')
        try {
          expect(value).to.be(1)
          done()
        } catch (e) {
          done(e)
        }
      }, 15) // default delay is 500ms
    })
  })

  it('HAP-Homematic set LEVEL 0%', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    accessory.delayOnSet = 10
    let service = accessory.getService(Service.Lightbulb)
    assert.ok(service, 'Lightbulb not found')
    let chTar = service.getCharacteristic(Characteristic.Brightness)
    chTar.setValue(0, () => {
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('HmIP.6483408182ABCD:4.LEVEL')
        try {
          expect(value).to.be(0)
          done()
        } catch (e) {
          done(e)
        }
      }, 15) // default delay is 500ms
    })
  })
})
