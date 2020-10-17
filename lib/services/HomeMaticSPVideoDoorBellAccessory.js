const path = require('path')
const Accessory = require('hap-nodejs').Accessory
const Service = require('hap-nodejs').Service
const HAP = require('hap-nodejs')
const fs = require('fs')
const FFMPEG = require(path.join(__dirname, 'ffmpeg.js'))
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

module.exports = class HomeMaticSPVideoDoorBellAccessory extends HomeMaticAccessory {
  createHomeKitAccessory () {
    this.debugLog('publishing services for %s', this.getName())

    this.homeKitAccessory = new Accessory(this._name, this._accessoryUUID, Accessory.Categories.VIDEO_DOORBELL)
    this.homeKitAccessory.on('identify', (paired, callback) => {}

    )

    this.homeKitAccessory.log = this.log
  }

  publishServices (Service, Characteristic) {
    let self = this
    let ffmpegpath = path.join(this.getDeviceSettings('ffmpegpath'))
    let camera = {
      'ffmpegpath': ffmpegpath,
      'source': '-re -i ' + this.getDeviceSettings('video_source'),
      'stillImageSource': '-i ' + this.getDeviceSettings('video_stillImageSource'),
      'maxStreams': 2,
      'maxWidth': 640,
      'maxHeight': 480,
      'maxFPS': 30,
      'vcodec': 'libx264',
      'debug': true
    }

    if (fs.existsSync(ffmpegpath)) {
      try {
        this.log.info('will use settings %s', JSON.stringify(camera))
        this.homeKitAccessory.configureCameraSource(new FFMPEG(HAP, this._name, camera, this.log))
      } catch (e) {
        console.log(e)
      }
      this.lockState = Characteristic.LockCurrentState.SECURED
      var doorLock = new Service.LockMechanism(this._name)
      this.homeKitAccessory.addService(doorLock)

      var lockCurrentState = doorLock.getCharacteristic(Characteristic.LockCurrentState)
        .on('get', function (callback) {
          callback(null, self.lockState)
        })

      lockCurrentState.updateValue(this.lockState, null)

      var targetState = doorLock.getCharacteristic(Characteristic.LockTargetState)

        .on('get', function (callback) {
          callback(null, self.lockState)
        })
        .on('set', function (value, callback) {
          self.lockState = Characteristic.LockCurrentState.UNSECURED
          targetState.updateValue(self.lockState, null)
          lockCurrentState.updateValue(self.lockState, null)
          self.debugLog('open door lock')

          setTimeout(() => {
          // and reset all this
            self.debugLog('reseting door lock')
            self.lockState = Characteristic.LockCurrentState.SECURED
            targetState.updateValue(self.lockState, null)
            lockCurrentState.updateValue(self.lockState, null)
          }, 1000 * 1)

          callback()
        })

      targetState.updateValue(this.lockState, null)

      let doorBellSensor = this.getDeviceSettings('address_door_bell_key')
      if (doorBellSensor) {
        this.log.debug('doorBellSensor is %s', doorBellSensor)
        let doorbellService = new Service.Doorbell(this._name)
        this.homeKitAccessory.addService(doorbellService)

        this.initialQuery = true
        let dingDong = doorbellService.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
          .on('get', function (callback) {
            callback(null, 0)
          })

        this.registerAddressForEventProcessingAtAccessory(this.buildAddress(doorBellSensor), (newValue) => {
          if (!self.initialQuery) {
            self.debugLog('DingDong')
            dingDong.updateValue(0, null)
          }
          self.initialQuery = false
        })
      }
    } else {
      this.log.error('ffmpeg not found at %s', ffmpegpath)
    }
  }

  isBridgedAccessory () {
    return false
  }

  getPublishInfo () {
    console.log('Setup on Port %s', this.getPort())
    return {
      username: '00:00:11:22:22:11',
      port: this.getPort(),
      pincode: this.getDeviceSettings('pin-code') || '123-45-678',
      category: Accessory.Categories.VIDEO_DOORBELL,
      mdns: {multicast: true}
    }
  }

  static serviceDescription () {
    return 'This service provides a Video door bell for HomeKit'
  }

  static configurationItems () {
    return {
      'address_door_bell_key': {
        type: 'text',
        label: 'Address door bell indicator',
        selector: 'datapoint',
        hint: '',
        options: {filterChannels: ['KEY', 'VIRTUAL_KEY']}
      },
      'video_source': {
        type: 'text',
        hint: '',
        label: 'URL RTSP video'
      },
      'video_stillImageSource': {
        type: 'text',
        hint: '',
        label: 'URL still image',
        default: 'https://upload.wikimedia.org/wikipedia/en/9/93/Buddy_christ.jpg'
      },
      'pin-code': {
        type: 'text',
        hint: '',
        label: 'PinCode',
        default: '123-45-678'
      },
      'ffmpegpath': {
        type: 'text',
        hint: '',
        label: 'Path to ffmpg',
        default: 'bin/ffmpeg'
      }

    }
  }

  static channelTypes () {
    return ['SPECIAL']
  }
}
