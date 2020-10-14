
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

module.exports = class HomeMaticDoorOpenerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let onTime = this.getDeviceSettings().OnTime || '10'

    this.debugLog('creating Service')
    this.service = this.getService(Service.LockMechanism)
    this.lockState = Characteristic.LockCurrentState.SECURED

    var lockCurrentState = this.service.getCharacteristic(Characteristic.LockCurrentState)
      .on('get', (callback) => {
        callback(null, self.lockState)
      })

    lockCurrentState.updateValue(this.lockState, null)

    var targetState = this.service.getCharacteristic(Characteristic.LockTargetState)

      .on('get', (callback) => {
        callback(null, self.lockState)
      })
      .on('set', async (value, callback) => {
        self.lockState = Characteristic.LockCurrentState.UNSECURED
        targetState.updateValue(self.lockState, null)
        lockCurrentState.updateValue(self.lockState, null)
        self.debugLog('open door lock')
        await self.setValue('ON_TIME', parseInt(onTime))
        self.setValue('STATE', 1)
        callback()

        setTimeout(() => {
          self.lockState = Characteristic.LockCurrentState.SECURED
          targetState.updateValue(self.lockState, null)
          lockCurrentState.updateValue(self.lockState, null)
        }, parseInt(onTime) * 1000)
      })

    targetState.updateValue(this.lockState, null)
  }

  static getPriority () {
    return 1
  }

  static channelTypes () {
    return ['SWITCH', 'SWITCH_VIRTUAL_RECEIVER']
  }

  static serviceDescription () {
    return 'This service provides a door lock service which will actuate a switch'
  }

  static configurationItems () {
    return {
      'OnTime': {
        type: 'number',
        default: 0,
        label: 'On Time',
        hint: 'HAP will switch off this device automatically after the given seconds. Default is 10 sec.'
      }
    }
  }
}
