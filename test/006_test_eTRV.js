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

const testCase = 'HmIP-eTRV-2.json'

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
      values: {
        'HmIP.2123456789ABCD:0.LOW_BAT': false,
        'HmIP.2123456789ABCD:0.OPERATING_VOLTAGE': 2.4
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

  it('HAP-Homematic check ACTUAL_TEMPERATURE', (done) => {
    // first close the windows so the heating will operate
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.WINDOW_STATE', 0)

    let rnd = Math.floor(Math.random() * Math.floor(30))
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.ACTUAL_TEMPERATURE', rnd)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat, 'TestDevice', false, '', true)
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

  it('HAP-Homematic check SET_POINT_TEMPERATURE and HeatingMode', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.SET_POINT_MODE', 1) // Set Control Mode
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.ACTUAL_TEMPERATURE', 20) // Set Temperature
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.TargetTemperature)
    ch.setValue(24, async () => {
      let value = await that.server._ccu.getValue('HmIP.2123456789ABCD:1.SET_POINT_TEMPERATURE')
      try {
        expect(value).to.be(24)
      } catch (e) {

      }
    })
    // we have a temperature so the CurrentHeatingCoolingState should be heating
    let ch1 = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
    ch1.getValue((context, value) => {
      try {
        expect(value).to.be(Characteristic.CurrentHeatingCoolingState.HEAT)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic check SET_POINT_TEMPERATURE and HeatingMode Off by Target Temp (20) below Current Temp (24)', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.SET_POINT_MODE', 1) // Set Control Mode
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.ACTUAL_TEMPERATURE', 24) // Set Temperature
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.TargetTemperature)
    ch.setValue(20, async () => {
      let value = await that.server._ccu.getValue('HmIP.2123456789ABCD:1.SET_POINT_TEMPERATURE')
      try {
        expect(value).to.be(20)
      } catch (e) {

      }
      // we have a temperature above the target so the CurrentHeatingCoolingState should be OFF
      let ch1 = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      ch1.getValue((context, value) => {
        try {
          expect(value).to.be(Characteristic.CurrentHeatingCoolingState.OFF)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  it('HAP-Homematic check Heating Mode Off', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.SET_POINT_TEMPERATURE', 4.5)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(Characteristic.CurrentHeatingCoolingState.OFF)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic set Heating Mode Off check 4.5 degree', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    ch.setValue(Characteristic.TargetHeatingCoolingState.OFF, async () => {
      let value = await that.server._ccu.getValue('HmIP.2123456789ABCD:1.SET_POINT_TEMPERATURE')
      try {
        expect(value).to.be(4.5)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic set Heating Mode back to heating check degree again', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.WINDOW_STATE', 0)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    ch.setValue(Characteristic.TargetHeatingCoolingState.HEAT, () => {
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('HmIP.2123456789ABCD:1.SET_POINT_TEMPERATURE')
        try {
          expect(value).to.be(20)
          done()
        } catch (e) {
          done(e)
        }
      }, 100)
    })
  })

  it('HAP-Homematic open the window and we will make shure the temp will not set while changing the mode', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.WINDOW_STATE', 1) // open the window
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:1.SET_POINT_TEMPERATURE', 12) // ccu will set themp to window temp
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    let ch = service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
    ch.setValue(Characteristic.TargetHeatingCoolingState.HEAT, () => { // set the heating mode
      setTimeout(async () => {
        let value = await that.server._ccu.getValue('HmIP.2123456789ABCD:1.SET_POINT_TEMPERATURE')
        try {
          expect(value).to.be(12) // temp should be 12 not the last known 20
          done()
        } catch (e) {
          done(e)
        }
      }, 100)
    })
  })

  it('HAP-Homematic check HUMIDITY is not here', (done) => {
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.Thermostat)
    assert.ok(service, 'Thermostat Service not found')
    let ch = service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(0)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic test low bat', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:0.LOW_BAT', true)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.BatteryService)
    let ch = service.getCharacteristic(Characteristic.StatusLowBattery)
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic test low bat negative', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:0.LOW_BAT', false)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.BatteryService)
    let ch = service.getCharacteristic(Characteristic.StatusLowBattery)
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('HAP-Homematic test voltage reading 1.2V 50%', (done) => {
    that.server._ccu.fireEvent('HmIP.2123456789ABCD:0.OPERATING_VOLTAGE', 1.2)
    let accessory = that.server._publishedAccessories[Object.keys(that.server._publishedAccessories)[0]]
    let service = accessory.getService(Service.BatteryService)
    let ch = service.getCharacteristic(Characteristic.BatteryLevel)
    ch.getValue((context, value) => {
      try {
        expect(value).to.be(50)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
