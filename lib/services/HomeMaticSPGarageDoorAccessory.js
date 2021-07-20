/*
 * File: HomeMaticSPGarageDoorAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 29th March 2020 5:32:18 pm
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

class HomeMaticSPGarageDoorAccessory extends HomeMaticAccessory {
  publishServices(Service, Characteristic) {
    let self = this
    if (this.loadSettings()) {
      var garagedoorService = this.addService(new Service.GarageDoorOpener(this._name))

      this.obstacle = garagedoorService.getCharacteristic(Characteristic.ObstructionDetected)
        .on('get', (callback) => {
          if (callback) callback(null, false)
        })

      this.currentDoorState = garagedoorService.getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', async (callback) => {
          let returnValue = Characteristic.CurrentDoorState.STOPPED
          let doorState = await self.fetchCurrentHMDoorState()
          if (this.twoSensorMode) {
            if (doorState === 0) { // Closed
              returnValue = Characteristic.CurrentDoorState.CLOSED
              if (self.targetCommand) {
                self.targetDoorState.updateValue(Characteristic.TargetDoorState.CLOSED, null)
              }
            }
            if (doorState === 1) { // moving
              returnValue = Characteristic.CurrentDoorState.OPENING // or closing its moving
            }

            if (doorState === 2) { // open
              returnValue = Characteristic.CurrentDoorState.OPEN
              if (self.targetCommand) {
                self.targetDoorState.updateValue(Characteristic.TargetDoorState.OPEN, null)
              }
            }
          } else {
            if (doorState === 0) {
              returnValue = Characteristic.CurrentDoorState.CLOSED
            }
            if (doorState === 2) {
              returnValue = Characteristic.CurrentDoorState.OPEN
            }
          }
          if (callback) {
            if (callback) callback(null, returnValue)
          }
        })

      this.targetDoorState = garagedoorService.getCharacteristic(Characteristic.TargetDoorState)
        .on('set', (value, callback) => {
          self.targetCommand = true
          clearTimeout(this.requeryTimer)

          if (this.twoActorMode) {
            if (value === Characteristic.TargetDoorState.OPEN) {
              if (!self.isInhibitForOpening) {
                self.debugLog('two actor mode send Open ...')
                self.currentDoorState.updateValue(Characteristic.CurrentDoorState.OPENING, null)

                if ((self.message_actor_open.on) && (self.message_actor_open.onTime)) {
                  self.debugLog('two actor mode send  open actor message with ON Time...')
                  self.sendActorMessage(self.address_actor_open, self.message_actor_open.on, undefined, parseInt(self.message_actor_open.onTime))
                } else {
                  if (self.message_actor_open.on) {
                    self.debugLog('two actor mode send open actor message ...')
                    self.sendActorMessage(self.address_actor_open, self.message_actor_open.on)
                  }

                  if (self.message_actor_open.off) {
                    self.debugLog('two actor mode send reset open actor message ...')
                    self.sendActorMessage(self.address_actor_open, self.message_actor_open.off, self.delay_actor_open)
                  }
                }
                /* new inhibit handling */
                if (self.message_actor_open.inhibitTime) {
                  let it = parseInt(self.message_actor_open.inhibitTime) * 1000 // create milliseconds
                  if (it > 0) {
                    self.debugLog('Set inhibt opening for %s milliseconds', it)
                    self.isInhibitForOpening = true // set inhibit
                    clearTimeout(self.inhibitTimer)
                    self.inhibitTimer = setTimeout(() => {
                      self.debugLog('ReSet inhibit opening')
                      self.isInhibitForOpening = false // reset inhibit
                    }, it)
                  }
                }
              } else {
                self.debugLog('isInhibitForOpening is set ignoring event')
              }
              // reset Command Switch to override target
              self.targetCommand = false
              self.requeryTimer = setTimeout(() => {
                self.debugLog('garage door requery sensors ...')
                self.querySensors()
              }, 1000 * self.sensor_requery_time)
            } else { // Closing process
              if (!self.isInhibitForClosing) { // Check Inhibit
                self.currentDoorState.updateValue(Characteristic.CurrentDoorState.CLOSING, null)
                // Check Messages so if there are not defined do no perform them
                if ((self.message_actor_close.on) && (self.message_actor_close.onTime)) {
                  self.debugLog('two actor mode send close with on Time...')
                  self.sendActorMessage(self.address_actor_close, self.message_actor_close.on, undefined, parseInt(self.message_actor_close.onTime))
                } else {
                  if (self.message_actor_close.on) {
                    self.debugLog('two actor mode send close ...')
                    self.sendActorMessage(self.address_actor_close, self.message_actor_close.on)
                  }
                  if (self.message_actor_close.off) {
                    self.debugLog('two actor mode send reset actor message ...')
                    self.sendActorMessage(self.address_actor_close, self.message_actor_close.off, self.delay_actor_close)
                  }
                }

                if (self.message_actor_close.inhibitTime) {
                  let it = parseInt(self.message_actor_close.inhibitTime) * 1000 // create milliseconds
                  if (it > 0) {
                    self.debugLog('Set inhibt closing for %s milliseconds', it)
                    self.isInhibitForClosing = true // set inhibit
                    clearTimeout(self.inhibitTimer)
                    self.inhibitTimer = setTimeout(() => {
                      self.debugLog('Reset inhibt closing')
                      self.isInhibitForClosing = false // reset inhibit
                    }, it)
                  }
                }
              } else {
                self.debugLog('isInhibitForClosing is set ignoring event')
              }
              // reset Command Switch to override target
              self.targetCommand = false
              self.requeryTimer = setTimeout(() => {
                self.debugLog('garage door requery sensors ...')
                self.querySensors()
              }, 1000 * self.sensor_requery_time)
            }
          } else { // One Actor Mode .. just trigger the same actor
            self.debugLog('HomeKit target message is %s ...', value)
            if (value === Characteristic.TargetDoorState.OPEN) {
              self.currentDoorState.updateValue(Characteristic.CurrentDoorState.OPENING, null)
            } else {
              self.currentDoorState.updateValue(Characteristic.CurrentDoorState.CLOSING, null)
            }
            if (!self.isInhibitForOpening) { // just use the opening inhibt cause we have the time setup in the open message
              self.debugLog('  ...')
              if ((self.message_actor_open.on) && (self.message_actor_open.onTime)) {
                self.debugLog('one actor mode send open with onTime %s ...', self.message_actor_open.onTime)
                self.sendActorMessage(self.address_actor_open, self.message_actor_open.on, undefined, parseInt(self.message_actor_open.onTime))
              } else {
                if (self.message_actor_open.on) {
                  self.debugLog('one actor mode send open ...')
                  self.sendActorMessage(self.address_actor_open, self.message_actor_open.on)
                }
                if (self.message_actor_open.off) {
                  self.debugLog('one actor mode send reset actor ...')
                  self.sendActorMessage(self.address_actor_open, self.message_actor_open.off, self.delay_actor_open)
                }
              }

              if (self.message_actor_open.inhibitTime) {
                let it = parseInt(self.message_actor_open.inhibitTime) * 1000 // create milliseconds
                if (it > 0) {
                  self.debugLog('Set inhibt for %s milliseconds', it)
                  self.isInhibitForOpening = true // set inhibit
                  clearTimeout(self.inhibitTimer)
                  self.inhibitTimer = setTimeout(() => {
                    self.debugLog('ReSet inhibit')
                    self.isInhibitForOpening = false // reset inhibit
                  }, it)
                }
              }
            } else {
              self.debugLog('isInhibitForOpening is set ignoring event')
            }
            self.requeryTimer = setTimeout(() => {
              // reset Command Switch to override target
              self.targetCommand = false
              self.debugLog('garage door requery sensors ...')
              self.querySensors()
            }, 1000 * self.sensor_requery_time)
          }
          if (callback) callback()
        }) // End TargetDoorState set
        .on('get', async (callback) => {
          let returnValue
          let doorState = await self.fetchCurrentHMDoorState()
          if (doorState === 0) { // close
            returnValue = Characteristic.TargetDoorState.CLOSED
          }
          // Moving state is not part of targetDoorState

          if (doorState === 2) { // open
            returnValue = Characteristic.TargetDoorState.OPEN
          }

          if (callback) {
            if (callback) callback(null, returnValue)
          }
        })
      // register for sensor events

      if (this.twoSensorMode) {
        self.debugLog('Running in two sensor mode so registering Close sensor %s events and open sensor %s events', this.address_sensor_close, this.address_sensor_open)
        this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_sensor_close), (newValue) => {
          clearTimeout(self.requeryTimer)
          self.debugLog('Close Sensor Event %s', newValue)
          self.lastSensorCloseState = newValue
          let ds = self.processSensorStates()
          self.debugLog('last doorstate was %s new door state %s', self.lastDoorState, ds)
          switch (ds) {
            case 0: //close
              self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.CLOSED)
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.CLOSED, false, 200)
              self.lastDoorState = 0
              break
            case 1: // moving
              if (self.lastDoorState === 0) { // last DoorState was closed so maybe open
                self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.OPEN)
                self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.OPENING, 200)
              } else {
                self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.CLOSED)
                self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.CLOSING, false, 200)
              }
              break
            case 2: // open
              self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.OPEN)
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.OPEN, false, 200)
              break
          }

        })

        this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_sensor_open), (newValue) => {
          clearTimeout(self.requeryTimer)
          self.lastSensorOpenState = newValue
          self.debugLog('Open Sensor Event %s', newValue)
          let ds = self.processSensorStates()
          self.debugLog('last doorstate was %s new door state %s', self.lastDoorState, ds)
          switch (ds) {
            case 0: //close
              self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.CLOSED)
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.CLOSED, false, 200)
              break
            case 1: // moving
              if (self.lastDoorState === 0) { // last DoorState was closed so maybe open
                self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.OPEN)
                self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.OPENING, false, 200)
              } else {
                self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.CLOSED)
                self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.CLOSING, false, 200)
              }
              break
            case 2: // open
              self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.OPEN)
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.OPEN, false, 200)
          }
        })
      } else {
        self.debugLog('Running in one sensor mode so registering Close sensor %s events only', this.address_sensor_closen)
        this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_sensor_close), (newValue) => {
          self.lastSensorCloseState = newValue
          self.debugLog('Sensor Event %s', newValue)
          let ds = self.processSensorStates()
          switch (ds) {
            case 0:
              self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.CLOSED)
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.CLOSED, false, 1000)

              break
            case 2:
              self.updateCharacteristic(self.targetDoorState, Characteristic.TargetDoorState.OPEN)
              self.updateCharacteristic(self.currentDoorState, Characteristic.CurrentDoorState.OPEN, false, 1000)
              break
          }
          self.targetCommand = false
        })
      }
    }
  }

  // this will fetch the current sensor states and return the corresponding door state
  fetchCurrentHMDoorState() {
    let self = this
    return new Promise(async (resolve, reject) => {

      if (self.twoSensorMode) {
        self.debugLog('Two sensor mode. Fetching value for Close Sensor %s -> %s', self.address_sensor_close, self.lastSensorCloseState)
        self.lastSensorCloseState = await self.getValue(self.address_sensor_close, true)
        self.lastSensorOpenState = await self.getValue(self.address_sensor_open, true)
        self.debugLog('Two sensor mode. Fetching value for Open Sensor %s -> %s', self.address_sensor_open, self.lastSensorOpenState)
        resolve(self.processSensorStates())
      } else {
        self.lastSensorCloseState = await self.getValue(self.address_sensor_close, true)
        self.debugLog('One sensor mode. Fetching value for Close Sensor %s -> %s', self.address_sensor_close, self.lastSensorCloseState)
        resolve(self.processSensorStates())
      }
    })
  }


  processSensorStates() {
    if (this.twoSensorMode) {
      if ((this.didMatch(this.lastSensorCloseState, this.state_sensor_close)) && (!this.didMatch(this.lastSensorOpenState, this.state_sensor_open))) {
        this.debugLog('values shows door is closed')
        this.lastDoorState = 0
        return 0;
      }

      if ((!this.didMatch(this.lastSensorCloseState, this.state_sensor_close)) && (!this.didMatch(this.lastSensorOpenState, this.state_sensor_open))) {
        this.debugLog('values shows door is moving')
        return 1; // moving
      }

      if ((!this.didMatch(this.lastSensorCloseState, this.state_sensor_close)) && (this.didMatch(this.lastSensorOpenState, this.state_sensor_open))) {
        this.debugLog('values shows door is open')
        this.lastDoorState = 2
        return 2; // open
      }
    } else {
      if (this.didMatch(this.lastSensorCloseState, this.state_sensor_close)) {
        this.debugLog('values match close state')
        this.lastDoorState = 0
        return 0;
      } else {
        this.debugLog('values match open state')
        this.lastDoorState = 2
        return 2;
      }
    }
  }


  querySensors() {
    if (this.twoSensorMode) {
      this.getValue(this.address_sensor_close, true)
      this.getValue(this.address_sensor_open, true)
    } else {
      this.getValue(this.address_sensor_close, true)
    }
  }

  loadSettings() {
    this.isInhibitForOpening = false
    this.isInhibitForClosing = false

    let settings = this.getDeviceSettings()

    this.address_sensor_close = this.getDeviceSettings('address_sensor_close', false)
    this.address_sensor_open = settings.address_sensor_open

    this.state_sensor_close = settings.state_sensor_close || true
    this.state_sensor_open = settings.state_sensor_open || true

    this.address_actor_open = settings.address_actor_open
    this.address_actor_close = this.getDeviceSettings('address_actor_close', false)

    this.delay_actor_open = settings.delay_actor_open || 5
    this.delay_actor_close = settings.delay_actor_close || 5

    let mo = settings.message_actor_open || { 'on': 1, 'off': 0 }

    if (typeof mo === 'object') {
      this.message_actor_open = mo
    } else {
      this.message_actor_open = this.parseConfigurationJSON(mo, { 'on': 1, 'off': 0 })
    }

    let mc = settings.message_actor_close || { 'on': 1, 'off': 0 }

    if (typeof mc === 'object') {
      this.message_actor_close = mc
    } else {
      this.message_actor_close = this.parseConfigurationJSON(mc, { 'on': 1, 'off': 0 })
    }

    this.sensor_requery_time = settings.sensor_requery_time || 30

    this.targetCommand = false
    let adrSensorCloseIsValid = true
    let adrActorCloseIsValid = true
    // validate configuration
    if (this.isDatapointAddressValid(this.address_sensor_close, false) === false) {
      this.log.error('cannot initialize garage device address for close sensor is invalid')
      return false
    }

    if (this.isDatapointAddressValid(this.address_sensor_open, true) === false) {
      this.log.error('cannot initialize garage device address for open sensor is invalid')
      adrSensorCloseIsValid = false
      return false
    }

    if (this.isDatapointAddressValid(this.address_actor_open, false) === false) {
      this.log.error('cannot initialize garage device address for open actor is invalid')
      return false
    }

    if (this.isDatapointAddressValid(this.address_actor_close, true) === false) {
      this.log.error('cannot initialize garage device address for close actor is invalid')
      adrActorCloseIsValid = false
      return false
    }

    // detect door mode
    // show configuration
    this.twoSensorMode = (
      (this.address_sensor_close !== undefined) &&
      (this.address_sensor_close !== "") &&
      (this.address_sensor_open !== undefined) &&
      (this.address_sensor_open !== "") &&
      (adrSensorCloseIsValid === true))

    this.debugLog('Garage Door Config: %s sensor mode', this.twoSensorMode ? 'two' : 'one')
    if (this.twoSensorMode) {
      this.debugLog('Sensor open  is %s', this.address_sensor_open)
      this.debugLog('Sensor open value is %s', this.state_sensor_open)
    }
    this.debugLog('Sensor close  is %s', this.address_sensor_close)
    this.debugLog('Sensor close value is %s', this.state_sensor_close)

    this.twoActorMode = (
      (this.address_actor_open !== undefined) &&
      (this.address_actor_open !== "") &&
      (this.address_actor_close !== undefined) &&
      (this.address_actor_close !== "") &&
      (adrActorCloseIsValid === true)
    )
    this.debugLog('Garage Door Config: %s actor mode', this.twoActorMode ? 'two' : 'one')

    return true
  }

  async sendActorMessage(address, message, delay, onTime) {
    let self = this
    if ((message !== undefined) && (address !== undefined)) {
      if (delay === undefined) {
        this.debugLog('send Actor Message %s to %s', message, address)
        if (onTime !== undefined) {
          let onTimeDP = address.replace('.STATE', '.ON_TIME') // we should add some checks here
          await this.setValue(onTimeDP, parseInt(onTime))
        }
        this.setValue(address, message)
      } else {
        clearTimeout(this.setTimer)
        this.setTimer = setTimeout(async () => {
          self.debugLog('send Actor Message %s to %s', message, address)

          if (onTime !== undefined) {
            let onTimeDP = address.replace('.STATE', '.ON_TIME') // we should add some checks here
            await self.setValue(onTimeDP, parseInt(onTime))
          }
          self.setValue(address, message)
        }, 1000 * delay)
      }
    } else {
      this.log.error('unknown actor or message %s to %s', address, message)
    }
  }

  shutdown() {
    clearTimeout(this.setTimer)
    clearTimeout(this.requeryTimer)
    clearTimeout(this.timer)
    super.shutdown()
  }

  static channelTypes() {
    return ['SPECIAL']
  }

  static configurationItems() {
    return {
      'address_sensor_close': {
        type: 'text',
        label: 'Address close sensor',
        hint: 'Address of the sensor which signals a closed door (mandatory) | Note if you want to use a variable the syntax is V.Varname',
        selector: 'datapoint',
        options: { filterChannels: ['CONTACT', 'SHUTTER_CONTACT', 'TILT_SENSOR', 'ACCELERATION_TRANSCEIVER', 'SHUTTER_CONTACT_TRANSCEIVER', 'MULTI_MODE_INPUT_TRANSMITTER'] },
        mandatory: true
      },
      'state_sensor_close': {
        type: 'text',
        default: true,
        label: 'State close sensor',
        hint: 'Value of the sensor which signals a closed door (mandatory)',
        mandatory: true
      },

      'address_sensor_open': {
        type: 'text',
        label: 'Address open sensor',
        hint: 'Address of the sensor which signals a open door (optional) | Note if you want to use a variable the syntax is V.Varname',
        selector: 'datapoint',
        options: { filterChannels: ['CONTACT', 'SHUTTER_CONTACT', 'TILT_SENSOR', 'ACCELERATION_TRANSCEIVER', 'SHUTTER_CONTACT_TRANSCEIVER', 'MULTI_MODE_INPUT_TRANSMITTER'] },
        mandatory: false
      },
      'state_sensor_open': {
        type: 'text',
        default: true,
        label: 'State open sensor',
        hint: 'Value of the sensor which signals a open door (optional)',
        mandatory: false
      },
      'address_actor_open': {
        type: 'text',
        label: 'Address open actor',
        hint: 'Address of the actor which opens the door (mandatory)',
        selector: 'datapoint',
        options: { filterChannels: ['SWITCH', 'SWITCH_VIRTUAL_RECEIVER'] },
        mandatory: true
      },
      'address_actor_close': {
        type: 'text',
        label: 'Address close actor',
        hint: 'Address of the actor which closes the door (optional)',
        selector: 'datapoint',
        options: { filterChannels: ['SWITCH', 'SWITCH_VIRTUAL_RECEIVER'] },
        mandatory: false
      },
      'delay_actor_open': {
        type: 'number',
        default: 5,
        label: 'Delay open actor',
        hint: 'Delay in seconds to reset the open actor (optional)',
        mandatory: false
      },
      'delay_actor_close': {
        type: 'number',
        default: 5,
        label: 'Delay close actor',
        hint: 'Delay in seconds to reset the close actor (optional)',
        mandatory: false
      },
      'message_actor_open': {
        type: 'text',
        default: '{"on": 1, "off": 0}',
        label: 'Message open actor',
        hint: 'The message to send to the open actor JSON  (optional)',
        mandatory: false
      },
      'message_actor_close': {
        type: 'text',
        default: '{"on": 1, "off": 0}',
        label: 'Message close actor',
        hint: 'The message to send to the close actor JSON  (optional)',
        mandatory: false
      },
      'sensor_requery_time': {
        type: 'number',
        default: 5,
        label: 'Sensor requery time',
        hint: 'Time the sensors will be queried again to fetch a new door state (optional)',
        mandatory: false
      }
    }
  }

  static serviceDescription() {
    return 'This service provides a garage door opener in HomeKit based on multiple devices from your ccu'
  }

  static validate(configurationItem) {
    return false
  }
}

module.exports = HomeMaticSPGarageDoorAccessory
