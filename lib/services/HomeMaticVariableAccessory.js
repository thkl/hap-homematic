const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticVariableAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    if ((this.variable.valuetype === 2) && (this.variable.subtype === 2)) {
      let service = this.getService(Service.Switch)
      this.state = service.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
          self._ccu.getVariableValue(self._serial).then((newValue) => {
            callback(null, self.isTrue(newValue) ? 1 : 0)
          })
        })
        .on('set', (newValue, callback) => {
          self.log.debug('[Variable] set %s', newValue)
          self._ccu.setVariable(self._serial, self.isTrue(newValue)).then((result) => {
            self.log.debug('[Variable] set Result %s', result)
            if (callback) {
              callback()
            }
          })
        })

      this.state.eventEnabled = true
    }

    if ((this.variable.valuetype === 4) && (this.variable.subtype === 0)) {
      this.minValue = parseFloat(this.variable.minvalue)
      this.maxValue = parseFloat(this.variable.maxvalue)

      let service = this.getService(Service.Lightbulb)

      this.isOnCharacteristic = service.getCharacteristic(Characteristic.On)

        .on('get', (callback) => {
          self._ccu.getVariableValue(self._serial).then((newValue) => {
            self.log.debug('[Variable] value %s Min is set isOn %s', parseFloat(newValue), (parseFloat(newValue) >= self.minValue))
            callback(null, (parseFloat(newValue) > self.minValue))
          })
        })

        .on('set', (value, callback) => {
          self._ccu.setVariable(self._serial, (value) ? self.maxValue : self.minValue).then((result) => {
            self.log.debug('[Variable] set Result %s', result)
          })
          if (callback) {
            callback()
          }
          self.updateVariable()
        })

      this.level = service.addCharacteristic(Characteristic.Brightness)
        .on('get', (callback) => {
          self._ccu.getVariableValue(self._serial).then((newValue) => {
            callback(null, parseFloat(newValue))
          })
        })
        .on('set', (newValue, callback) => {
          self.log.debug('[Variable] set %s', newValue)

          clearTimeout(self.timer)
          self.timer = setTimeout(() => {
            self._ccu.setVariable(self._serial, parseFloat(newValue)).then((result) => {
              self.log.debug('[Variable] set Result %s', result)
              self.updateVariable()
            })
          }, 500)

          if (callback) {
            callback()
          }
        })
        // setup the level
      this.level.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: this.variable.unit,
        maxValue: parseFloat(this.variable.maxvalue),
        minValue: parseFloat(this.variable.minvalue),
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      })
      this.level.eventEnabled = true
    }

    // initial call
    this.updateVariable()
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.timer)
  }

  async updateVariable () {
    let newValue = await this._ccu.getVariableValue(this._serial)
    if (this.state) {
      this.state.updateValue(this.isTrue(newValue), null)
    }

    if (this.level) {
      this.log.info('[Variable] update level %s', parseFloat(newValue))
      this.level.updateValue(parseFloat(newValue), null)
      this.log.info('[Variable] update setOn %s', (parseFloat(newValue) > this.minValue))
      this.isOnCharacteristic.updateValue((parseFloat(newValue) >= this.minValue), null)
    }
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a switch or lightbulb to control variables'
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticVariableAccessory
