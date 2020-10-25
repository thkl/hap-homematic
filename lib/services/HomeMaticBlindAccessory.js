/*
 * File: HomeMaticBlindAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 8th March 2020 6:20:55 pm
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

class HomeMaticBlindAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var blind = this.getService(Service.WindowCovering)
    this.delayOnSet = 750

    this.inhibit = false
    let settings = this.getDeviceSettings()
    this.debugLog('init Blind with settings %s', JSON.stringify(settings))
    this.minValueForClose = (settings.MinForClose) ? parseInt(settings.MinForClose) : 0
    this.maxValueForOpen = (settings.MaxForOpen) ? parseInt(settings.MaxForOpen) : 100

    this.minValueClose = (settings.MinClose) ? parseInt(settings.MinClose) : 0
    this.maxValueOpen = (settings.MaxOpen) ? parseInt(settings.MaxOpen) : 100
    this.observeInhibit = (settings.observeInhibit !== undefined) ? this.isTrue(settings.observeInhibit) : true
    this.ignoreWorking = true
    this.currentLevel = 0
    this.targetLevel = undefined
    this.isWorking = false

    this.currentPos = blind.getCharacteristic(Characteristic.CurrentPosition)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
        value = self.processBlindLevel(value)
        self.debugLog('getCurrent Position %s', value)
        if (callback) callback(null, value)
      })

    this.currentPos.eventEnabled = true

    this.targetPos = blind.getCharacteristic(Characteristic.TargetPosition)
      .on('get', async (callback) => {
        self.debugLog('get TargetPosition (working %s)', self.isWorking)
        if ((self.isWorking === false) || (self.targetLevel === undefined)) {
          self.debugLog('not working query ccu and sent value back')
          let value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
          value = self.processBlindLevel(value)
          if (callback) {
            self.debugLog('return %s as TargetPosition', value)
            callback(null, value)
          }
        } else {
          self.debugLog('return previously selected target position %s', self.targetLevel)
          callback(null, self.targetLevel)
        }
      })

      .on('set', (value, callback) => {
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
          self.targetLevel = value
          self.debugLog('send new targetlevel %s', self.targetLevel)
          self.eventupdate = false // whaat?
          clearTimeout(self.setTime)
          self.isWorking = true
          self.setTime = setTimeout(() => {
            self.debugLog('send new level %s', (parseFloat(value) / 100))
            self.setValueForDataPointNameWithSettingsKey('level', null, (parseFloat(value) / 100))
          }, self.delayOnSet)
        }
        callback()
      })

    this.hold = blind.getCharacteristic(Characteristic.HoldPosition)
      .on('set', (value, callback) => {
        if (self.isTrue(value)) {
          self.setValue('STOP', true)
        }
        callback()
      })

    this.pstate = blind.getCharacteristic(Characteristic.PositionState)
      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('direction', null, true)
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
        .on('get', async (callback) => {
          let value = self.getValueForDataPointNameWithSettingsKey('inhibit', null, true)
          self.inhibit = self.isTrue(value)
          self.debugLog('set Obstructions to %s', self.inhibit)
          callback(null, self.inhibit)
        })
      this.obstruction.eventEnabled = true

      this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('inhibit', null, (newValue) => {
        self.debugLog('inhibit event set Obstructions to %s', newValue)
        self.inhibit = self.isTrue(newValue)
        if (self.obstruction !== undefined) {
          self.obstruction.updateValue(self.isTrue(newValue), null)
        }
      })
    } else {
      self.debugLog('we will ignore INHIBIT')
    }

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('direction', null, (newValue) => {
      self.updatePosition(parseInt(newValue))
    })

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
        self.currentPos.updateValue(self.currentLevel, null)
      }
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('working', null, (newValue) => {
    // Working false will trigger a new remote query
      self.debugLog('working event %s', newValue)
      if (!self.isTrue(newValue)) {
        self.debugLog('working ended')
        self.isWorking = false
        self.getValueForDataPointNameWithSettingsKey('level', null, true)
        self.targetLevel = undefined
      } else {
        self.debugLog('working started')
        self.isWorking = true
      }
    })

    this.queryData()
    // fetch the current possition every 2 minutes // this is just for testing
    this.updateInterval = setInterval(() => {
      self.queryData()
    }, 30 * 60 * 1000) // Query every 30 minutes
  }

  async queryData () {
    // trigger new event (datapointEvent)
    // kill the cache first
    let self = this
    let value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
    value = self.processBlindLevel(value)
    self.debugLog('qery set current pos to %s', value)
    self.currentPos.updateValue(value, null)
    if (self.isWorking === false) {
      self.debugLog('not working so update the target position to %s', value)
      self.targetPos.updateValue(value, null)
    }

    if (this.observeInhibit === true) {
      value = await self.getValueForDataPointNameWithSettingsKey('inhibit', null, true)
      self.updateObstruction(self.isTrue(value)) // not sure why value (true/false) is currently a string? - but lets convert it if it is
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
    this.debugLog('processLevel (%s) min (%s) max (%s) r (%s)', newValue, this.minValueForClose, this.maxValueForOpen, value)
    this.reportedLevel = value
    return value
  }

  // https://github.com/thkl/homebridge-homematic/issues/208
  // if there is a custom close level and the real level is below homekit will get the 0% ... and visevera for max level

  setFinalBlindLevel (value) {
    this.debugLog('setFinalBlindLevel to %s', value)
    value = this.processBlindLevel(value)
    this.currentPos.updateValue(value, null)
    this.targetPos.updateValue(value, null)
    this.targetLevel = undefined
    this.pstate.updateValue(2, null) // STOPPED
  }

  updatePosition (value) {
    // 0 = NONE (Standard)
    // 1=UP
    // 2=DOWN
    // 3=UNDEFINED
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
      this.debugLog('guessTargetPosition to %s', value)
      this.targetPos.updateValue(value, null)
    }
  }

  updateObstruction (value) {
    this.inhibit = value
    this.obstruction.updateValue(value, null)
  }

  shutdown () {
    this.debugLog('shutdown')
    super.shutdown()
    clearTimeout(this.timer)
    clearTimeout(this.setTime)
    clearInterval(this.updateInterval)
  }

  initServiceSettings () {
    return {
      'BLIND': {
        inhibit: {name: 'INHIBIT'},
        direction: {name: 'DIRECTION'},
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'}
      },
      'JALOUSIE': {
        inhibit: {name: 'INHIBIT'},
        direction: {name: 'DIRECTION'},
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'},
        slats: {name: 'LEVEL_SLATS'},
        workingslats: {name: 'WORKING_SLATS'}
      }
    }
  }

  static channelTypes () {
    return ['BLIND', 'JALOUSIE']
  }

  static serviceDescription () {
    return 'You can control your blinds with this service'
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
      },
      'observeInhibit': {
        type: 'checkbox',
        default: true,
        label: 'Observe Inhibit',
        hint: 'when checked the blind will not move when inhbit is set'
      }
    }
  }
}
module.exports = HomeMaticBlindAccessory
