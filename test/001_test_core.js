const assert = require('assert')
const path = require('path')
const Logger = require(path.join(__dirname, '..', 'lib', 'logger.js'))
const Server = require(path.join(__dirname, '..', 'lib', 'Server.js'))
const fs = require('fs')
let log = new Logger('HAP Test')

describe('HAP-Homematic Tests', () => {
  let that = this

  before(async () => {
    log.info('preparing tests')
    let datapath = path.join(__dirname, 'devices', 'HmIP-SWDM.json')
    let strData = fs.readFileSync(datapath).toString()
    if (strData) {
      let data = JSON.parse(strData)
      that.server = new Server(log)
      await that.server.simulate(undefined, {config: {

        channels: ['0123456789ABCD:1']

      },
      devices: [data]})
    } else {
      assert.ok(false, 'Unable to load Test data')
    }
  })

  after(() => {

  })

  it('HAP-Homematic check test mode', () => {
    assert.strict.equal(that.server.isTestMode, true)
  })

  it('HAP-Homematic check number of ccu devices', () => {
    assert.strict.equal(that.server._ccu.getCCUDevices().length, 1)
  })

  it('HAP-Homematic check number of mappend devices', () => {
    assert.strict.equal(Object.keys(that.server._publishedAccessories).length, 1)
  })
})
