
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticPowerMeterAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    this.refreshTime = 10 * 60 * 1000
    var sensor = this.getService(this.eve.Service.PowerMeterService)
    this.enableLoggingService('energy')

    if (this.getDataPointNameFromSettings('power')) {
      this.power = sensor.getCharacteristic(this.eve.Characteristic.ElectricPower)
        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('power', true).then(value => {
          // logging will be done by the event handler
            if (callback) callback(null, value)
          })
        })

      this.power.eventEnabled = true
    }

    if (this.getDataPointNameFromSettings('energyCounter')) {
      this.energyCounter = sensor.getCharacteristic(this.eve.Characteristic.TotalConsumption)
        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('energyCounter', true).then(value => {
            // CCU sends wH -- homekit haz kwh - so calculate /1000
            value = Number((value / 1000)).toFixed(2)
            if (callback) {
              callback(null, value)
            }
          })
        })

      this.energyCounter.eventEnabled = true
    }

    if (this.getDataPointNameFromSettings('current')) {
      this.currentCharacteristic = sensor.getCharacteristic(this.eve.Characteristic.ElectricCurrent)
        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('current', true).then(value => {
            if (callback) {
              callback(null, parseFloat(value))
            }
          })
        })

      this.currentCharacteristic.eventEnabled = true
    }

    if (this.getDataPointNameFromSettings('voltage')) {
      this.voltageCharacteristic = sensor.getCharacteristic(this.eve.Characteristic.Voltage)
        .on('get', function (callback) {
          self.getValueForDataPointNameWithSettingsKey('voltage', true).then(value => {
            if (callback) {
              callback(null, parseInt(value))
            }
          })
        })

      this.voltageCharacteristic.eventEnabled = true
    }

    this.addResetStatistics(sensor, () => {
      self.log.debug('[PMS] reset Stats')
    })

    if (this.power) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('power', (newValue) => {
        self.addLogEntry({ power: parseFloat(newValue) })
        self.power.updateValue(parseFloat(newValue), null)
      })
    }

    if (this.energyCounter) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('energyCounter', (newValue) => {
      // CCU sends wH -- homekit haz kwh - so calculate /1000
        let value = (parseFloat(newValue) / 1000)
        self.energyCounter.updateValue(Number(value).toFixed(2), null)
      })
    }

    if (this.currentCharacteristic) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('current', (newValue) => {
        self.energyCounter.updateValue(parseFloat(newValue), null)
      })
    }

    if (this.voltageCharacteristic) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('voltage', (newValue) => {
        self.energyCounter.updateValue(parseInt(newValue), null)
      })
    }

    this.initialQueryTimer = setTimeout(function () {
      self.queryData()
    }, self.refreshTime)
  }

  queryData () {
    var self = this
    if (this.power) { this.getValueForDataPointNameWithSettingsKey('power', true) }
    if (this.energyCounter) { this.getValueForDataPointNameWithSettingsKey('energyCounter', true) }
    if (this.currentCharacteristic) { this.getValueForDataPointNameWithSettingsKey('current', true) }
    if (this.voltageCharacteristic) { this.getValueForDataPointNameWithSettingsKey('voltage', true) }
    // create timer to query device every 10 minutes
    this.refreshTimer = setTimeout(function () { self.queryData() }, self.refreshTime)
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.refreshTimer)
    clearTimeout(this.initialQueryTimer)
  }

  initServiceSettings () {
    return {
      '*': {
        power: 'POWER',
        energyCounter: 'ENERGY_COUNTER'
      }
    }
  }

  static channelTypes () {
    return ['POWERMETER_IGL']
  }
}
module.exports = HomeMaticPowerMeterAccessory
