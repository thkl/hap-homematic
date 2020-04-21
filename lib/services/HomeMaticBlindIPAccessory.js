// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticBlindIPAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var blind = this.getService(Service.WindowCovering)
    this.delayOnSet = 750
    this.observeInhibit = false // make this configurable
    this.inhibit = false
    let settings = this.getDeviceSettings()
    this.log.debug('[BLINDIP] init Blind with settings %s', JSON.stringify(settings))
    this.minValueForClose = (settings.MinForClose) ? parseInt(settings.MinForClose) : 0
    this.maxValueForOpen = (settings.MaxForOpen) ? parseInt(settings.MaxForOpen) : 100

    this.minValueClose = (settings.MinClose) ? parseInt(settings.MinClose) : 0
    this.maxValueOpen = (settings.MaxOpen) ? parseInt(settings.MaxOpen) : 100

    this.ignoreWorking = true
    this.currentLevel = 0
    this.targetLevel = undefined
    this.isWorking = false

    this.currentPos = blind.getCharacteristic(Characteristic.CurrentPosition)
      .on('get', (callback) => {
        self.getValue('4.LEVEL', false).then(value => {
          value = self.processBlindLevel(value)
          self.log.debug('[BLINDIP] getCurrent Position %s', value)
          if (callback) callback(null, value)
        })
      })

    this.currentPos.eventEnabled = true

    this.targetPos = blind.getCharacteristic(Characteristic.TargetPosition)
      .on('get', (callback) => {
        self.getValue('4.LEVEL', false).then(value => {
          value = self.processBlindLevel(value)
          if (callback) {
            self.log.debug('[BLINDIP] return %s as TargetPosition', value)
            callback(null, value)
          }
        })
      })
      .on('set', (value, callback) => {
      // if obstruction has been detected
        if ((self.observeInhibit === true) && (self.inhibit === true)) {
        // wait one second to resync data
          self.log.debug('[BLINDIP] inhibit is true wait to resync')
          clearTimeout(self.timer)
          self.timer = setTimeout(() => {
            self.queryData()
          }, 1000)
        } else {
          if (parseFloat(value) < self.minValueClose) {
            value = parseFloat(self.minValueClose)
          }

          if (parseFloat(value) > self.maxValueOpen) {
            value = parseFloat(self.maxValueOpen)
          }

          self.targetLevel = value
          self.eventupdate = false // whaat?
          self.setValueDelayed('4.LEVEL', (parseFloat(value) / 100), self.delayOnSet)
        }
        callback()
      })

    this.pstate = blind.getCharacteristic(Characteristic.PositionState)
      .on('get', (callback) => {
        self.getValue('ACTIVITY_STATE', false).then(value => {
          if (callback) {
            var result = 2
            if (value !== undefined) {
              switch (value) {
                case 0:
                  result = 2 // Characteristic.PositionState.STOPPED
                  break
                case 1:
                  result = 0 // Characteristic.PositionState.DECREASING
                  break
                case 2:
                  result = 1 // Characteristic.PositionState.INCREASING
                  break
                case 3:
                  result = 2 // Characteristic.PositionState.STOPPED
                  break
              }
              callback(null, result)
            } else {
              callback(null, '0')
            }
          }
        })
      })

    // this.pstate.eventEnabled = true

    if (this.observeInhibit === true) {
      this.obstruction = blind.getCharacteristic(Characteristic.ObstructionDetected)
        .on('get', (callback) => {
          callback(null, this.inhibit)
        })
      this.obstruction.eventEnabled = true
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress('INHIBIT'), (newValue) => {
        self.log.debug('[BLINDIP] set Obstructions to %s', newValue)
        self.inhibit = self.isTrue(newValue)
        if (self.obstruction !== undefined) {
          self.obstruction.updateValue(self.isTrue(newValue), null)
        }
      })
    }

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('4.ACTIVITY_STATE'), (newValue) => {
      self.updatePosition(parseInt(newValue))
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('4.LEVEL'), (newValue) => {
      if (self.isWorking === false) {
        self.log.debug('[BLINDIP] set final HomeKitValue to %s', newValue)
        self.setFinalBlindLevel(newValue)
        self.realLevel = parseFloat(newValue * 100)
      } else {
        let lvl = self.processBlindLevel(newValue)
        self.realLevel = parseFloat(newValue * 100)
        self.log.debug('[BLINDIP] set HomeKitValue to %s', lvl)
        self.currentLevel = lvl
        self.currentPos.updateValue(self.currentLevel, null)
      }
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PROCESS'), (newValue) => {
    // Working false will trigger a new remote query
      if (!self.isTrue(newValue)) {
        self.isWorking = false
        self.getValue('4.LEVEL', true)
      } else {
        self.isWorking = true
      }
    })

    this.queryData()
  }

  queryData (value) {
    // trigger new event (datapointEvent)
    // kill the cache first
    let self = this
    this.getValue('4.LEVEL', true).then(value => {
      value = self.processBlindLevel(value)
      self.currentPos.updateValue(value, null)
      self.targetPos.updateValue(value, null)
      self.targetLevel = undefined
    })

    if (this.observeInhibit === true) {
      this.getValue('INHIBIT', true).then(value => {
        self.updateObstruction(self.isTrue(value)) // not sure why value (true/false) is currently a string? - but lets convert it if it is
      })
    }
  }

  processBlindLevel (newValue) {
    var value = parseFloat(newValue)
    value = value * 100
    this.realLevel = value
    if (value <= this.minValueForClose) {
      value = 0
    }
    if (value >= this.maxValueForOpen) {
      value = 100
    }
    this.log.debug('[BLINDIP] processLevel (%s) min (%s) max (%s) r (%s)', newValue, this.minValueForClose, this.maxValueForOpen, value)
    this.reportedLevel = value
    return value
  }

  // https://github.com/thkl/homebridge-homematic/issues/208
  // if there is a custom close level and the real level is below homekit will get the 0% ... and visevera for max level

  setFinalBlindLevel (value) {
    value = this.processBlindLevel(value)
    this.currentPos.updateValue(value, null)
    this.targetPos.updateValue(value, null)
    this.targetLevel = undefined
    this.pstate.updateValue(2, null) // STOPPED
  }

  updatePosition (value) {
    // 0 = UNKNOWN (Standard)
    // 1=UP
    // 2=DOWN
    // 3=STABLE
    switch (value) {
      case 0:
        this.pstate.updateValue(2, null)
        break
      case 1: // opening - INCREASING
        this.pstate.updateValue(1, null)
        // set target position to maximum, since we don't know when it stops
        this.guessTargetPosition(100)
        break
      case 2: // closing - DECREASING
        this.pstate.updateValue(0, null)
        // same for closing
        this.guessTargetPosition(0)
        break
      case 3:
        this.pstate.updateValue(2, null)
        break
    }
  }

  guessTargetPosition (value) {
    // Only update Target position if it has not been set via homekit (see targetPos.on('set'))
    if (this.targetLevel === undefined) {
      this.targetPos.updateValue(value, null)
    }
  }

  updateObstruction (value) {
    this.inhibit = value
    this.obstruction.updateValue(value, null)
  }

  shutdown () {
    this.log.debug('[BLINDIP] shutdown')
    super.shutdown()
    clearTimeout(this.timer)
  }

  static channelTypes () {
    return ['SHUTTER_VIRTUAL_RECEIVER']
  }

  static configurationItems () {
    return {
      'MinForClose': {
        type: 'number',
        default: 0,
        label: 'min value for close',
        hint: 'set homkit to close if the blind is below this value'
      },
      'MaxForOpen': {
        type: 'number',
        default: 100,
        label: 'max value for open',
        hint: 'set homkit to open if the blind is above this value'
      },
      'MinClose': {
        type: 'number',
        default: 0,
        label: 'min value',
        hint: 'do not close the blind below this level'
      },
      'MaxOpen': {
        type: 'number',
        default: 100,
        label: 'max value',
        hint: 'do not open the blind above this level'
      }
    }
  }
}
module.exports = HomeMaticBlindIPAccessory
