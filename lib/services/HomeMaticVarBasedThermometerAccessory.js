const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticVarBasedThermometerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.thermometer = this.getService(Service.TemperatureSensor)
    this.enableLoggingService('weather')

    this.cctemp = this.thermometer.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', async (callback) => {
        let newValue = await self._ccu.getVariableValue(self.nameInCCU)
        if (callback) callback(null, parseFloat(newValue))
      })

    this.cctemp.eventEnabled = true
    this.queryData()
  }

  async queryData () {
    var self = this
    let newValue = await this._ccu.getVariableValue(this.nameInCCU)
    if ((this.cctemp) && (newValue != null)) {
      this.cctemp.updateValue(parseFloat(newValue), null)
      this.addLogEntry({temp: parseFloat(newValue), pressure: 0, humidity: 1})
    }

    this.refreshTimer = setTimeout(() => {
      self.queryData()
    }, 10 * 60 * 1000)
  }

  updateVariable () {
    this.queryData()
  }

  shutdown () {
    this.log.debug('[VBT] shutdown')
    super.shutdown()
    clearTimeout(this.refreshTimer)
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a temperature sensor HomeKit based on a variable from your ccu'
  }

  static configurationItems () {
    return {
    }
  }
}

module.exports = HomeMaticVarBasedThermometerAccessory
