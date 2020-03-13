
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticPowerMeterAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this

    this.refreshTime = 10 * 60 * 1000
    var sensor = this.getService(this.eve.Service.PowerMeterService)
    this.enableLoggingService('energy')
    this.power = sensor.getCharacteristic(this.eve.Characteristic.ElectricPower)
      .on('get', function (callback) {
        self.getValue('POWER', true).then(value => {
          // logging will be done by the event handler
          if (callback) callback(null, value)
        })
      })

    this.power.eventEnabled = true

    this.energyCounter = sensor.getCharacteristic(this.eve.Characteristic.TotalConsumption)
      .on('get', function (callback) {
        self.getValue('ENERGY_COUNTER', true).then(value => {
        // CCU sends wH -- homekit haz kwh - so calculate /1000
          value = Number((value / 1000)).toFixed(2)
          if (callback) {
            callback(null, value)
          }
        })
      })

    this.energyCounter.eventEnabled = true

    this.addResetStatistics(sensor, () => {
      self.log.debug('[PMS] reset Stats')
    })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('POWER'), function (newValue) {
      self.addLogEntry({ power: parseFloat(newValue) })
      self.power.updateValue(parseFloat(newValue), null)
    })

    this.registeraddressForEventProcessingAtAccessory(this.buildAddress('ENERGY_COUNTER'), function (newValue) {
      // CCU sends wH -- homekit haz kwh - so calculate /1000
      let value = (parseFloat(newValue) / 1000)
      self.energyCounter.updateValue(Number(value).toFixed(2), null)
    })

    this.initialQueryTimer = setTimeout(function () {
      self.queryData()
    }, self.refreshTime)
  }

  queryData () {
    var self = this
    this.getValue('POWER', true)
    this.getValue('ENERGY_COUNTER', true)
    // create timer to query device every 10 minutes
    this.refreshTimer = setTimeout(function () { self.queryData() }, self.refreshTime)
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.refreshTimer)
    clearTimeout(this.initialQueryTimer)
  }

  static channelTypes () {
    return ['POWERMETER_IGL']
  }
}
module.exports = HomeMaticPowerMeterAccessory
