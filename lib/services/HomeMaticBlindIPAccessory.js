/*
 * File: HomeMaticBlindIPAccessory.js
 * Project: hap-homematic
 * File Created: Tuesday, 21st April 2020 7:00:43 pm
 * Author: Thomas Kluge (th.kluge@me.com)
 * -----
 * The MIT License (MIT)
 *
 * Copyright (c) Thomas Kluge <th.kluge@me.com> (https://github.com/thkl)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ==========================================================================
 */

const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticBlindIPAccessory extends HomeMaticAccessory {
  publishServices(Service, Characteristic) {
    let self = this
    var blind = this.getService(Service.WindowCovering)

    this.observeInhibit = false // make this configurable
    this.inhibit = false
    let settings = this.getDeviceSettings()
    this.debugLog('init Blind with settings %s', JSON.stringify(settings))
    this.minValueForClose = (settings.MinForClose) ? parseInt(settings.MinForClose) : 0
    this.maxValueForOpen = (settings.MaxForOpen) ? parseInt(settings.MaxForOpen) : 100

    this.minValueClose = (settings.MinClose) ? parseInt(settings.MinClose) : 0
    this.maxValueOpen = (settings.MaxOpen) ? parseInt(settings.MaxOpen) : 100
    this.observeInhibit = (settings.observeInhibit !== undefined) ? this.isTrue(settings.observeInhibit) : true
    this.useSlats = (settings.useSlats !== undefined) ? this.isTrue(settings.useSlats) : false

    this.hazSlats = (this.getDataPointNameFromSettings('slats', null))

    this.hazCurrentLevel = (this.getDataPointNameFromSettings('getlevel', null))

    this.ignoreWorking = true
    this.currentLevel = 0
    this.targetLevel = undefined
    this.targetLevelSlat = 1.01
    this.isWorking = false
    this.delayOnSet = 250
    this.reverse = settings.reverse

    this.currentPos = blind.getCharacteristic(Characteristic.CurrentPosition)
      .on('get', async (callback) => {
        let value
        if (this.hazCurrentLevel) {
          value = await self.getValueForDataPointNameWithSettingsKey('getlevel', null, true)
        } else {
          value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
        }
        value = self.processBlindLevel(value)
        self.debugLog('getCurrent Position %s', value)
        if (callback) callback(null, value)
      })

    this.currentPos.eventEnabled = true

    this.targetPos = blind.getCharacteristic(Characteristic.TargetPosition)
      .on('get', async (callback) => {
        let value
        if (this.hazCurrentLevel) {
          value = await self.getValueForDataPointNameWithSettingsKey('getlevel', null, true)
        } else {
          value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
        }
        value = self.processBlindLevel(value)
        if (callback) {
          self.debugLog('return %s as TargetPosition', value)
          callback(null, value)
        }
      })
      .on('set', (value, callback) => {
        self.debugLog('set target position %s with delay %s', value, self.delayOnSet)
        // if obstruction has been detected
        if ((self.observeInhibit === true) && (self.inhibit === true)) {
          // wait one second to resync data
          self.debugLog('inhibit is true wait to resync')
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

          if (self.reverse === true) {
            value = 100 - value
          }
          let sValue = parseFloat(value) / 100

          self.targetLevel = sValue
          self.eventupdate = false // whaat?
          clearTimeout(self.setTimer)
          self.setTimer = setTimeout(() => {
            self.setHomeMaticLevels()
          }, self.delayOnSet)
        }
        callback()
      })

    this.pstate = blind.getCharacteristic(Characteristic.PositionState)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('activity', null, true)
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

    // this.pstate.eventEnabled = true

    if (this.observeInhibit === true) {
      this.obstruction = blind.getCharacteristic(Characteristic.ObstructionDetected)
        .on('get', (callback) => {
          callback(null, this.inhibit)
        })
      this.obstruction.eventEnabled = true
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('inhibit', null, (newValue) => {
        self.debugLog('set Obstructions to %s', newValue)
        self.inhibit = self.isTrue(newValue)
        if (self.obstruction !== undefined) {
          self.obstruction.updateValue(self.isTrue(newValue), null)
        }
      })
    }

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('activity', null, (newValue) => {
      self.updatePosition(parseInt(newValue))
    })

    if (this.hazCurrentLevel) {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('getlevel', null, (newValue) => {
        if (self.isWorking === false) {
          self.debugLog('set final HomeKitValue to %s', newValue)
          self.setFinalBlindLevel(newValue)
          self.realLevel = parseFloat(newValue * 100)
        } else {
          let lvl = self.processBlindLevel(newValue)
          self.realLevel = parseFloat(newValue * 100)
          self.debugLog('set currentPos HomeKitValue to %s', lvl)
          self.currentLevel = lvl
          self.updateCharacteristic(self.currentPos, self.currentLevel)
        }
      })
    } else {
      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('level', null, (newValue) => {
        if (self.isWorking === false) {
          self.debugLog('set final HomeKitValue to %s', newValue)
          self.setFinalBlindLevel(newValue)
          self.realLevel = parseFloat(newValue * 100)
        } else {
          let lvl = self.processBlindLevel(newValue)
          self.realLevel = parseFloat(newValue * 100)
          self.debugLog('set HomeKitValue to %s', lvl)
          self.currentLevel = lvl
          self.updateCharacteristic(self.currentPos, self.currentLevel)
        }
      })
    }
    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('process', null, (newValue) => {
      // Working false will trigger a new remote query
      if (parseInt(newValue) === 0) {
        self.debugLog('Blind has settled')
        self.isWorking = false
        let lvlKey = 'level'
        if (self.hazCurrentLevel) {
          lvlKey = 'getlevel'
        }

        self.getValueForDataPointNameWithSettingsKey(lvlKey, null, true).then(result => {
          self.debugLog('Blind has settled here is the new position %s', result)
          self.setFinalBlindLevel(result)
          self.realLevel = parseFloat(result * 100)
        })
      } else {
        self.debugLog('Blind start moving')
        self.isWorking = true
      }
    })

    // Check slats

    if ((this.hazSlats) && (this.useSlats)) {
      self.debugLog('adding slats')

      this.currentSlatPos = blind.getCharacteristic(Characteristic.CurrentHorizontalTiltAngle)
        .on('get', async (callback) => {
          let sLevel = await self.getValueForDataPointNameWithSettingsKey('slats', null, true)
          let hkLevel = -90 + (180 * parseFloat(sLevel))
          callback(null, hkLevel)
        })

      this.targetSlatPos = blind.getCharacteristic(Characteristic.TargetHorizontalTiltAngle)
        .on('get', async (callback) => {
          let sLevel = await self.getValueForDataPointNameWithSettingsKey('slats', null, true)
          let hkLevel = -90 + (180 * parseFloat(sLevel))
          callback(null, hkLevel)
        })
        .on('set', (value, callback) => {
          self.targetLevelSlat = (parseFloat(value) + 90) / 180
          self.debugLog('%s event set slats to %s', self._serial, self.targetLevelSlat)
          clearTimeout(self.setTimer)

          self.setTimer = setTimeout(() => {
            self.setHomeMaticLevels()
          }, self.delayOnSet)

          callback()
        })

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('slats', null, (newValue) => {
        let hkLevel = -90 + (180 * parseFloat(newValue))
        self.debugLog('event on slats %s will be %s', newValue, hkLevel)
        self.updateCharacteristic(self.currentSlatPos, hkLevel)
        self.updateCharacteristic(self.targetSlatPos, hkLevel)
      })
    }

    this.queryData()
  }

  setHomeMaticLevels() {
    // set the level to 1.01 to prevent moving //https://github.com/thkl/hap-homematic/issues/96#issuecomment-640172561
    if (this.targetLevel !== undefined) {
      this.debugLog('%s setHomeMaticLevels  Level %s', this._serial, this.targetLevel)
      this.setValueForDataPointNameWithSettingsKey('level', null, this.targetLevel)
    }
    if (this.targetLevelSlat !== undefined) {
      this.debugLog('%s setHomeMaticLevels Level_2 %s', this._serial, this.targetLevelSlat)
      this.setValueForDataPointNameWithSettingsKey('slats', null, this.targetLevelSlat)
    }
  }

  async queryData() {
    // trigger new event (datapointEvent)
    // kill the cache first
    let self = this
    let value
    if (this.hazCurrentLevel) {
      value = await self.getValueForDataPointNameWithSettingsKey('getlevel', null, true)
    } else {
      value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
    }
    value = self.processBlindLevel(value)
    self.updateCharacteristic(self.currentPos, value)
    self.updateCharacteristic(self.targetPos, value)

    if (this.observeInhibit === true) {
      let iValue = await self.getValueForDataPointNameWithSettingsKey('inhibit', null, true)
      self.updateObstruction(self.isTrue(iValue)) // not sure why value (true/false) is currently a string? - but lets convert it if it is
    }
  }

  processBlindLevel(newValue) {
    var value = parseFloat(newValue)
    value = value * 100
    this.realLevel = value
    if (value <= this.minValueForClose) {
      value = 0
    }
    if (value >= this.maxValueForOpen) {
      value = 100
    }
    if (this.reverse === true) {
      value = 100 - value
    }
    this.debugLog('processLevel input:%s min:%s max:%s reverse:%s output:%s', newValue, this.minValueForClose, this.maxValueForOpen, this.reverse, value)
    this.reportedLevel = value
    return value
  }

  // https://github.com/thkl/homebridge-homematic/issues/208
  // if there is a custom close level and the real level is below homekit will get the 0% ... and visevera for max level

  setFinalBlindLevel(value) {
    value = this.processBlindLevel(value)
    this.debugLog('Updating Final blind level %s', value)
    this.updateCharacteristic(this.currentPos, value)
    this.updateCharacteristic(this.targetPos, value)
    this.updateCharacteristic(this.pstate, 2) // STOPPED
  }

  updatePosition(value) {
    // 0 = UNKNOWN (Standard)
    // 1=UP
    // 2=DOWN
    // 3=STABLE
    switch (value) {
      case 0:
        this.updateCharacteristic(this.pstate, 2)
        break
      case 1: // opening - INCREASING
        this.updateCharacteristic(this.pstate, 1)
        // set target position to maximum, since we don't know when it stops
        break
      case 2: // closing - DECREASING
        this.updateCharacteristic(this.pstate, 0)
        // same for closing
        break
      case 3:
        this.updateCharacteristic(this.pstate, 2)
        break
    }
  }

  updateObstruction(value) {
    this.inhibit = value
    this.obstruction.updateValue(value, null)
  }

  shutdown() {
    this.debugLog('shutdown')
    super.shutdown()
    clearTimeout(this.timer)
    clearTimeout(this.setTimer)
  }

  initServiceSettings() {
    return {
      'SHUTTER_VIRTUAL_RECEIVER': {
        inhibit: { name: '4.INHIBIT' },
        activity: { name: '3.ACTIVITY_STATE' },
        level: { name: '4.LEVEL' },
        getlevel: { name: '3.LEVEL' },
        process: { name: '3.PROCESS' }
      },
      'BLIND_VIRTUAL_RECEIVER': {
        inhibit: { name: '4.INHIBIT' },
        activity: { name: '4.ACTIVITY_STATE' },
        level: { name: '4.LEVEL' },
        process: { name: '4.PROCESS' },
        slats: { name: '4.LEVEL_2' }
      },
      'HmIPW-DRBL4:BLIND_VIRTUAL_RECEIVER': {
        inhibit: { name: 'INHIBIT' },
        activity: { name: 'ACTIVITY_STATE' },
        level: { name: 'LEVEL' },
        process: { name: 'PROCESS' },
        slats: { name: 'LEVEL_2' }
      },
      'HmIP-HDM1:SHADING_RECEIVER': {
        inhibit: { name: 'INHIBIT' },
        activity: { name: 'ACTIVITY_STATE' },
        level: { name: 'LEVEL' },
        process: { name: 'PROCESS' }
      }
    }
  }

  static channelTypes() {
    return ['SHUTTER_VIRTUAL_RECEIVER', 'BLIND_VIRTUAL_RECEIVER', 'SHADING_RECEIVER']
  }

  static serviceDescription() {
    return 'You can control your blinds with this service'
  }

  static configurationItems() {
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
      },
      'observeInhibit': {
        type: 'checkbox',
        default: true,
        label: 'Observe Inhibit',
        hint: 'when checked the blind will not move when inhbit is set'
      },
      'useSlats': {
        type: 'checkbox',
        default: true,
        label: 'Add Slats',
        hint: 'when available a control to manipulate the slats will be added'
      },
      'reverse': {
        type: 'checkbox',
        default: false,
        label: 'reverse values',
        hint: '0 is 100 and 100 is 0'
      }
    }
  }
}
module.exports = HomeMaticBlindIPAccessory
