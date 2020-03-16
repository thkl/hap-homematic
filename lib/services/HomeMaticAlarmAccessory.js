// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticAlarmAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.sensor = this.getService(Service.SecuritySystem)

    this.currentState = this.sensor.getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .on('get', function (callback) {
        self.getValueForDataPointNameWithSettingsKey('state', 'armstate', false).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('state', 'armstate', value))
          }
        })
      })

    this.targetState = this.sensor.getCharacteristic(Characteristic.SecuritySystemTargetState)
      .on('set', function (value, callback) {
        let hkValue = self.getDataPointResultMapping('state', 'armstate', value, 'mappingTarget', true)
        self.setValueForDataPointNameWithSettingsKey('state', 'armstate', hkValue)
        callback()
      })
      .on('get', function (callback) {
        self.getValueForDataPointNameWithSettingsKey('state', 'armstate', false).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('state', 'armstate', value, 'mappingTarget'))
          }
        })
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', 'armstate', (newValue) => {
      let mappedValue = self.getDataPointResultMapping('state', 'armstate', newValue)
      self.currentState.updateValue(mappedValue, null)
      self.systemCurrentState = mappedValue
      let mappetTargetValue = self.getDataPointResultMapping('state', 'armstate', newValue, 'mappingTarget')
      self.targetState.updateValue(mappetTargetValue, null)
    })

    // register all 3 Alarm Channels
    let alTypes =
    ['intalarm',
      'extalarm',
      'panic']

    alTypes.map(atype => {
      self.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', atype, (newValue) => {
        if (self.isTrue(newValue)) {
          self.currentState.setValue(Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED, null)
        } else {
          self.currentState.setValue(self.systemCurrentState, null)
        }
      })
    })

    this.addTamperedCharacteristic(this.sensor, 4)
    this.addLowBatCharacteristic(this.sensor, 4)
  }

  static channelTypes () {
    return ['ARMING']
  }

  initServiceSettings (Characteristic) {
    return {
      '*': {
        'intalarm': {
          'state': '1.STATE'
        },
        'extalarm': {
          'state': '2.STATE'
        },
        'panic': {
          'state': '3.STATE'
        },
        'armstate': {
          'state': 'ARMSTATE',
          number: true,
          mapping: {
            0: Characteristic.SecuritySystemCurrentState.STAY_ARM,
            1: Characteristic.SecuritySystemCurrentState.NIGHT_ARM,
            2: Characteristic.SecuritySystemCurrentState.AWAY_ARM,
            3: Characteristic.SecuritySystemCurrentState.DISARM
          },
          mappingTarget: {
            0: Characteristic.SecuritySystemCurrentState.STAY_ARM,
            1: Characteristic.SecuritySystemTargetState.NIGHT_ARM,
            2: Characteristic.SecuritySystemCurrentState.AWAY_ARM,
            3: Characteristic.SecuritySystemTargetState.DISARM
          }
        }
      }
    }
  }

  configurationItems () {
    this.log.warn('[DUMMY] OVERRIDE THIS TO SPECIFY THE CONFIG ITEMS FOR THE SERVICE')
    return []
  }

  validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticAlarmAccessory
