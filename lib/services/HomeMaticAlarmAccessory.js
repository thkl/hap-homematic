// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticAlarmAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.sensor = this.getService(Service.SecuritySystem)

    this.currentState = this.sensor.getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .on('get', (callback) => {
        self.getValueForDataPointNameWithSettingsKey('state', 'armstate', false).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('armstate', null, value))
          }
        })
      })

    this.targetState = this.sensor.getCharacteristic(Characteristic.SecuritySystemTargetState)
      .on('set', (value, callback) => {
        let hkValue = self.getDataPointResultMapping('armstate', null, value, 'mappingTarget', true)
        self.log.debug('[ALSY] HK %s mapped to %s ', value, hkValue)
        self.setValueForDataPointNameWithSettingsKey('state', 'armstate', hkValue)
        callback()
      })
      .on('get', (callback) => {
        self.getValueForDataPointNameWithSettingsKey('state', 'armstate', false).then(value => {
          if (callback) {
            callback(null, self.getDataPointResultMapping('armstate', null, value, 'mappingTarget'))
          }
        })
      })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', 'armstate', (newValue) => {
      let mappedValue = self.getDataPointResultMapping('armstate', null, newValue)
      self.currentState.updateValue(mappedValue, null)
      self.systemCurrentState = mappedValue
      let mappetTargetValue = self.getDataPointResultMapping('armstate', null, newValue, 'mappingTarget')
      self.log.debug('[ALSY] HK %s mapped to %s ', newValue, mappetTargetValue)

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

  static serviceDescription () {
    return 'This service provides a alarm system for HomeKit'
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

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticAlarmAccessory
