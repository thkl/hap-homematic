const assert = require('assert')
const path = require('path')
const Logger = require(path.join(__dirname, '..', 'lib', 'logger.js'))
const Server = require(path.join(__dirname, '..', 'lib', 'Server.js'))
const Service = require('hap-nodejs').Service
const Characteristic = require('hap-nodejs').Characteristic
const expect = require('expect.js')

const fs = require('fs')
let log = new Logger('HAP Test')
log.setDebugEnabled(true)

const testCase = 'HM-TC-IT-WM-W-EU.json'

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
      mappings: that.data.mappings
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

  it('HAP-Homematic check ACTUAL_TEMPERATURE with random value', (done) => {
    let rnd = Math.floor(Math.random() * Math.floor(30))
    that.server._ccu.fireEvent('BidCos-RF.0123456789ABCD:2.ACTUAL_TEMPERATURE', rnd)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    assert.ok(service, 'Thermostat Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentTemperature)
    assert.ok(ch, 'CurrentTemperature State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(rnd)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check ACTUAL_HUMIDITY with random value', (done) => {
    let rnd = Math.floor(Math.random() * Math.floor(100))
    that.server._ccu.fireEvent('BidCos-RF.0123456789ABCD:2.ACTUAL_HUMIDITY', rnd)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(rnd)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check SET_TEMPERATURE and HeatingMode', (done) => {
    let rnd1 = Math.floor(Math.random() * Math.floor(30)) + 5 // make sure we do not set below the off themp
    // We have to set a Current Temperature below the new settemp to make sure the thermostate is in heating mode
    that.server._ccu.fireEvent('BidCos-RF.0123456789ABCD:2.ACTUAL_TEMPERATURE', rnd1 - 1)
    // Set The controlmode to manual
    that.server._ccu.fireEvent('BidCos-RF.0123456789ABCD:2.CONTROL_MODE', 1)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.TargetTemperature)
    ch.setValue(rnd1, async () => {
      let value = await that.server._ccu.getValue('BidCos-RF.0123456789ABCD:2.SET_TEMPERATURE')
      try {
        expect(value).to.be(rnd1)
      } catch (e) {

      }
    })
    // we have a temperature so the TargetHeatingCoolingState should be heating
    let ch1 = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    ch1.getValue((context, value) => {
      try {
        expect(value).to.be(Characteristic.CurrentHeatingCoolingState.HEAT)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check Heating Mode Off', (done) => {
    that.server._ccu.fireEvent('BidCos-RF.0123456789ABCD:2.SET_TEMPERATURE', 4.5)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(Characteristic.CurrentHeatingCoolingState.OFF)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
