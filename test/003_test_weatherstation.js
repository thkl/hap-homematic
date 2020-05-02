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

const testCase = 'HmIP-SWO-PR.json'

describe('HAP-Homematic Tests ' + testCase, () => {
  let that = this

  before(async () => {
    log.info('preparing tests')
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

  it('HAP-Homematic check ACTUAL_TEMPERATURE 10', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.ACTUAL_TEMPERATURE', 10.0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentTemperature)
    assert.ok(ch, 'CurrentTemperature State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(10)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check HUMIDITY 34', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.HUMIDITY', 34.0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    assert.ok(ch, 'CurrentRelativeHumidity State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(34)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check ILLUMINATION 140', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.ILLUMINATION', 140)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
    assert.ok(ch, 'CurrentAmbientLightLevel State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(140)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check RAIN_COUNTER 821', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.RAIN_COUNTER', 821)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentRainCountCharacteristic)
    assert.ok(ch, 'CurrentRainCountCharacteristic State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(821)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check RAINING true', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.RAINING', true)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.IsRainingCharacteristic)
    assert.ok(ch, 'IsRainingCharacteristic State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(true)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check SUNSHINEDURATION 340 min which are 5.6 hours', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.SUNSHINEDURATION', 340.0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentSunShineDurationCharacteristic)
    assert.ok(ch, 'CurrentRelativeHumidity State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(5.6)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check WIND_DIR 218', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.WIND_DIR', 218)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.WindDirectionCharacteristic)
    assert.ok(ch, 'WindDirectionCharacteristic State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(218)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check WIND_SPEED 98', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.WIND_SPEED', 98)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.WindSpeedCharacteristic)
    assert.ok(ch, 'WindSpeedCharacteristic State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(98)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check WIND_DIR_RANGE 12', (done) => {
    that.server._ccu.fireEvent('HmIP.0123456789ABCD:1.WIND_DIR_RANGE', 12.0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.WeatherStation)
    assert.ok(service, 'WeatherStation Service not found')
    let ch = service.getCharacteristic(Characteristic.WindRangeCharacteristic)
    assert.ok(ch, 'WindRangeCharacteristic State Characteristics not found')
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(12)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
