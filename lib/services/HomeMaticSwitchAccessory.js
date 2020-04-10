const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSwitchAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var service
    let subType = this.getDeviceSettings().Type || 'Lightbulb'
    let readOnly = this.isReadOnly()

    switch (subType) {
      case 'Outlet':
        service = this.getService(Service.Switch)
        break
      case 'Switch':
        service = this.getService(Service.Outlet)
        break
      default:
        service = this.getService(Service.Lightbulb)
        break
    }

    this.log.debug('[SWITCH] creating Service %s', subType)
    this.isOnCharacteristic = service.getCharacteristic(Characteristic.On)

    this.isOnCharacteristic.on('get', (callback) => {
      self.getValue('STATE', true).then(value => {
        callback(null, self.isTrue(value))
      })
    })

    this.isOnCharacteristic.on('set', (value, callback) => {
      if (!readOnly) {
        self.log.debug('[Switch] set switch %s', value)

        if (value === false) {
          self.setValue('STATE', 0)
        } else {
          self.setValue('STATE', 1)
        }
      } else {
        // check the state to reset the HomeKit State
        self.log.debug('[Switch] is readOnly .. skipping')
        setTimeout(() => {
          self.getValue('STATE', true)
        }, 1000)
      }
      callback()
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      self.log.debug('[SWITCH] event state %s', newValue)
      // Add a Log Entry for Eve
      self.addLogEntry({status: self.isTrue(newValue) ? 1 : 0})
      // Set Last Activation if the switch is on
      if (self.isTrue(newValue)) {
        self.updateLastActivation()
      }
      self.isOnCharacteristic.updateValue(self.isTrue(newValue), null)
    })
    // Loggin only works on Switches
    if (subType === 'Switch') {
      this.enableLoggingService('switch')
      this.addLastActivationService(service)
    }

    if (this._deviceType === 'HM-Dis-TD-T') {
      this.addLowBatCharacteristic(service)
    }
  }

  static channelTypes () {
    return ['SWITCH', 'STATUS_INDICATOR', 'SWITCH_VIRTUAL_RECEIVER']
  }

  static configurationItems () {
    return {
      'Type': {
        type: 'option',
        array: ['Lightbulb', 'Outlet', 'Switch'],
        default: 'Lightbulb',
        label: 'Subtype of this device',
        hint: 'A switch can have different sub types'
      }
    }
  }
}

module.exports = HomeMaticSwitchAccessory
