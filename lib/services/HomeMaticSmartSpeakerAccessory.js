// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSmartSpeakerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let service = this.addService(new Service.SmartSpeaker(this._name))

    service.setCharacteristic(Characteristic.ConfiguredName, 'Smart Speaker')
    service.setCharacteristic(Characteristic.Mute, false)

    service.getCharacteristic(Characteristic.Volume)
      .on('get', (callback) => {
        self.getValue('VOLUME', true).then((value) => {
          value = 10
          self.debugLog('get Volume %s', value)
          if (callback) callback(null, value)
        })
      })
      .on('set', (value, callback) => {
        self.debugLog('set Volume %s', value)
        callback()
      })

    //    Characteristic.TargetMediaState
    /*
      static readonly PLAY = 0;
  static readonly PAUSE = 1;
  static readonly STOP = 2;
  */

    let targetMediaState = service.getCharacteristic(Characteristic.TargetMediaState)
      .on('get', (callback) => {
        let cms = 0
        self.debugLog('get TargetMediaState')
        self.getValue('TRANSPORT_STATE', true).then((value) => {
          switch (value) {
            case 'STOPPED':
              cms = 2
              break
            case 'PAUSED_PLAYBACK':
              cms = 1
              break
            case 'PLAYING':
              cms = 0
              break
          }
          if (callback) callback(null, cms)
        })
      })
      .on('set', (value, callback) => {
        self.debugLog('set TargetMediaState %s', value)
        switch (value) {
          case 0:
            self.setValue('TRANSPORT_STATE', 'PLAYING')
            break
          case 1:
            self.setValue('TRANSPORT_STATE', 'PAUSED_PLAYBACK')
            break

          case 2:
            self.setValue('TRANSPORT_STATE', 'STOPPED')
            break
        }
        setTimeout(() => {
          self.updateCharacteristic(currentMediaState, value)
        }, 500)
        self.updateCharacteristic(targetMediaState, value)
        callback()
      })

    let currentMediaState = service.getCharacteristic(Characteristic.CurrentMediaState)

    /*
 static readonly PLAY = 0;
  static readonly PAUSE = 1;
  static readonly STOP = 2;
  */

      .on('get', (callback) => {
        let cms = 0
        self.getValue('TRANSPORT_STATE', true).then((value) => {
          switch (value) {
            case 'STOPPED':
              cms = 2
              break
            case 'PAUSED_PLAYBACK':
              cms = 1
              break
            case 'PLAYING':
              cms = 0
              break
          }
          self.debugLog('get CurrentMediaState %s', cms)
          if (callback) callback(null, cms)
        })
      })
      .on('set', (value, callback) => {
        callback()
      })
    /*    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'),  (newValue) => {
      self.state.updateValue(0, null)
    })
    */
  }

  static channelTypes () {
    return ['SPEAKER']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticSmartSpeakerAccessory
