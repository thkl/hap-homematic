const path = require('path')
const fs = require('fs')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSPCCUTempAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.thermometer = this.getService(Service.TemperatureSensor)
    this.enableLoggingService('weather')

    this.cctemp = this.thermometer.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', async (callback) => {
        let newValue = await self.readTemperature()
        if (callback) callback(null, parseFloat(newValue))
      })

    this.cctemp.eventEnabled = true

    this.queryData()
  }

  async queryData () {
    var self = this
    let newValue = await self.readTemperature()
    if (this.cctemp) {
      this.cctemp.updateValue(parseFloat(newValue), null)
      this.addLogEntry({temp: parseFloat(newValue), pressure: 0, humidity: 1})
    }

    this.refreshTimer = setTimeout(() => {
      self.queryData()
    }, 5 * 60 * 1000)
  }

  readTemperature () {
    var coreTemperature = 0
    let fileName = '/sys/class/thermal/thermal_zone0/temp'
    try {
      if (fs.existsSync(fileName)) {
        coreTemperature = parseFloat(fs.readFileSync(fileName))
        return (coreTemperature / 1000)
      }
    } catch (e) {
      return 0
    }
  }

  static validate (configurationItem) {
    return false
  }

  shutdown () {
    clearTimeout(this.refreshTimer)
    super.shutdown()
  }

  static channelTypes () {
    return ['SPECIAL']
  }

  static serviceDescription () {
    return 'This service provides a thermometer which will show your current ccu processor temperature'
  }
}

module.exports = HomeMaticSPCCUTempAccessory
