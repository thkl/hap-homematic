
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticBatVariableAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.BatteryService(this._name))
    let settings = this.getDeviceSettings()
    this.lowLevelValue = ((settings.lowLevelValue !== undefined) && (settings.lowLevelValue > 0)) ? parseInt(settings.lowLevelValue) : undefined

    this.levelCharacteristic = service.getCharacteristic(Characteristic.BatteryLevel)
      .on('get', (callback) => {
        self._ccu.getVariableValue(self._serial).then((newValue) => {
          callback(null, parseInt(newValue))
        })
      })
      .on('set', (value, callback) => {
        callback()
      })

    service.getCharacteristic(Characteristic.ChargingState)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })
      .on('set', (value, callback) => {
        callback()
      })

    if (this.lowLevelValue) {
      this.lowLevelCharacteristic = service.getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', (callback) => {
          self._ccu.getVariableValue(self._serial).then((newValue) => {
            callback(null, parseFloat(newValue) < self.lowLevelValue)
          })
        })
        .on('set', (value, callback) => {
          callback()
        })
    }
    this.updateVariable()
  }

  async updateVariable () {
    let newValue = await this._ccu.getVariableValue(this._serial)
    this.levelCharacteristic.updateValue(parseInt(newValue), null)
    if (this.lowLevelValue) {
      this.lowLevelCharacteristic.updateValue((parseFloat(newValue) < this.lowLevelValue), null)
    }
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a battery indicator based on a HomeMatic variable'
  }

  static configurationItems () {
    return {
      'lowLevelValue': {
        type: 'number',
        default: 0,
        label: 'LowLevel Value',
        hint: 'Battery level below this will trigger a LowLevel message'
      }
    }
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticBatVariableAccessory
