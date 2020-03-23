const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticVariableAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    let service = this.getService(Service.Switch)
    this.state = service.getCharacteristic(Characteristic.On)
      .on('get', function (callback) {
        self._ccu.getVariableValue(self._serial).then((newValue) => {
          callback(null, self.isTrue(newValue) ? 1 : 0)
        })
      })
      .on('set', function (newValue, callback) {
        self.log.debug('[Variable] set %s', newValue)
        self._ccu.setVariable(self._serial, self.isTrue(newValue)).then((result) => {
          self.log.debug('[Variable] set Result %s', result)
          if (callback) {
            callback()
          }
        })
      })

    this.state.eventEnabled = true
    // initial call
    this.updateVariable()
  }

  async updateVariable () {
    let newValue = await this._ccu.getVariableValue(this._serial)
    this.state.updateValue(this.isTrue(newValue), null)
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticVariableAccessory
