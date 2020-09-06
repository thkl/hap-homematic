
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSPMultiChannelPushButtonAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let settings = this.getDeviceSettings()
    if ((settings) && (settings.key)) {
      Object.keys(settings.key).map((aKey) => {
        let cadr = settings.key[aKey]
        self.createKeyService(self._name, cadr, Service, Characteristic)
      })
    }
  }

  createKeyService (name, homeMaticChannel, Service, Characteristic) {
    let self = this
    let cn = this._ccu.getChannelByAddress(homeMaticChannel)
    let ifId = this._ccu.getInterfaceWithID(cn.intf)

    // Adding Press Short
    let dpCmpl = ifId.name + '.' + homeMaticChannel + '.PRESS_SHORT'

    if (this.isDatapointAddressValid(dpCmpl, false) === true) {
      this.debugLog('Adding Key %s with name %s', dpCmpl, cn.name)

      let switchService = this.getService(Service.Switch, cn.name, true, cn.name)
      let isOn = switchService.getCharacteristic(Characteristic.On)
        .on('get', (callback) => {
          if (callback) callback(null, false)
        })
        .on('set', (value, callback) => {
          self.setValue(dpCmpl, true)
          setTimeout(() => {
            isOn.updateValue(false, null)
          }, 500)
          callback()
        })
    } else {
      self.debugLog('%s is not a valid datapoint', dpCmpl)
    }
  }

  static channelTypes () {
    return ['SPECIAL']
  }

  static configurationItems () {
    return {
      'key': {
        type: 'text_control_array',
        label: 'Address of the Key Channel',
        hint: '',
        selector: 'channel',
        options: {filterChannels: ['KEY', 'VIRTUAL_KEY', 'KEY_TRANSCEIVER']},
        mandatory: true
      }
    }
  }

  static serviceDescription () {
    return 'This service provides multiple HomeMatic Keys (to create a ccu event) in one device.'
  }
  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticSPMultiChannelPushButtonAccessory
