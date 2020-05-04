const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSPGarageDoorAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    if (this.loadSettings()) {
      var garagedoorService = this.addService(new Service.GarageDoorOpener(this._name))

      this.obstacle = garagedoorService.getCharacteristic(Characteristic.ObstructionDetected)
        .on('get', (callback) => {
          if (callback) callback(null, false)
        })

      this.currentDoorState = garagedoorService.getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', async (callback) => {
          var returnValue = Characteristic.CurrentDoorState.STOPPED
          if (this.twoSensorMode) {
            let closeSensorValue = await self.getValue(self.address_sensor_close, true)
            self.log.debug('[SPGDS] Two sensor mode. Fetching value for Close Sensor %s -> %s', self.address_sensor_close, closeSensorValue)
            let openSensorValue = await self.getValue(self.address_sensor_open, true)
            self.log.debug('[SPGDS] Two sensor mode. Fetching value for Open Sensor %s -> %s', self.address_sensor_open, openSensorValue)

            if ((self.didMatch(closeSensorValue, self.state_sensor_close)) && (!self.didMatch(openSensorValue, self.state_sensor_open))) {
              self.log.debug('[SPGDS] values shows CurrentDoorState is closed')
              returnValue = Characteristic.CurrentDoorState.CLOSED
              if (self.targetCommand) {
                self.targetDoorState.updateValue(self.characteristic.TargetDoorState.CLOSED, null)
              }
            }

            if ((!self.didMatch(closeSensorValue, self.state_sensor_close)) && (!self.didMatch(openSensorValue, self.state_sensor_open))) {
              returnValue = Characteristic.CurrentDoorState.OPENING // or closing its moving
            }

            if ((!self.didMatch(closeSensorValue, self.state_sensor_close)) && (self.didMatch(openSensorValue, self.state_sensor_open))) {
              returnValue = Characteristic.CurrentDoorState.OPEN
              if (self.targetCommand) {
                self.targetDoorState.updateValue(self.characteristic.TargetDoorState.OPEN, null)
              }
            }

            if (callback) callback(null, returnValue)
          } else {
            let closeSensorValue = await self.getValue(self.address_sensor_close, true)
            self.log.debug('[SPGDS] One sensor mode. Fetching value for Close Sensor %s -> %s', self.address_sensor_close, closeSensorValue)

            if (self.didMatch(closeSensorValue, self.state_sensor_close)) {
              self.log.debug('[SPGDS] values match close state')
              returnValue = Characteristic.CurrentDoorState.CLOSED
            } else {
              self.log.debug('[SPGDS] values %s vs %s did not match close state set door to open', closeSensorValue, self.state_sensor_close)
              returnValue = Characteristic.CurrentDoorState.OPEN
            }

            if (callback) callback(null, returnValue)
          }
        })

      this.targetDoorState = garagedoorService.getCharacteristic(Characteristic.TargetDoorState)
        .on('set', (value, callback) => {
          self.targetCommand = true
          clearTimeout(this.requeryTimer)

          if (this.twoActorMode) {
            if (value === Characteristic.TargetDoorState.OPEN) {
              self.log.debug('[SPGDS] two actor mode send Open ...')
              self.currentDoorState.updateValue(Characteristic.CurrentDoorState.OPENING, null)
              if (self.message_actor_open.on) {
                self.log.debug('[SPGDS] two actor mode send open ...')
                self.sendActorMessage(self.address_actor_open, self.message_actor_open.on)
              }
              if (self.message_actor_open.off) {
                self.log.debug('[SPGDS] two actor mode send reset open actor message ...')
                self.sendActorMessage(self.address_actor_open, self.message_actor_open.off, self.delay_actor_open)
              }
              // reset Command Switch to override target
              self.targetCommand = false
              self.requeryTimer = setTimeout(() => {
                self.log.debug('[SPGDS] garage door requery sensors ...')
                self.querySensors()
              }, 1000 * self.sensor_requery_time)
            } else {
              self.currentDoorState.updateValue(Characteristic.CurrentDoorState.CLOSING, null)
              // Check Messages so if there are not defined do no perform them
              if (self.message_actor_close.on) {
                self.log.debug('[SPGDS] two actor mode send close ...')
                self.sendActorMessage(self.address_actor_close, self.message_actor_close.on)
              }
              if (self.message_actor_close.off) {
                self.log.debug('[SPGDS] two actor mode send reset actor message ...')
                self.sendActorMessage(self.address_actor_close, self.message_actor_close.off, self.delay_actor_close)
              }

              // reset Command Switch to override target
              self.targetCommand = false
              self.requeryTimer = setTimeout(() => {
                self.log.debug('[SPGDS] garage door requery sensors ...')
                self.querySensors()
              }, 1000 * self.sensor_requery_time)
            }
          } else {
            if (value === Characteristic.TargetDoorState.OPEN) {
              self.currentDoorState.updateValue(Characteristic.CurrentDoorState.OPENING, null)
            } else {
              self.currentDoorState.updateValue(Characteristic.CurrentDoorState.CLOSING, null)
            }
            self.log.debug('[SPGDS] one actor mode send go message ...')
            if (self.message_actor_close.on) {
              self.log.debug('[SPGDS] one actor mode send open ...')
              self.sendActorMessage(self.address_actor_open, self.message_actor_open.on)
            }
            if (self.message_actor_close.off) {
              self.log.debug('[SPGDS] one actor mode send reset actor ...')
              self.sendActorMessage(self.address_actor_open, self.message_actor_open.off, self.delay_actor_open)
            }
            self.requeryTimer = setTimeout(() => {
              // reset Command Switch to override target
              self.targetCommand = false
              self.log.debug('[SPGDS] garage door requery sensors ...')
              self.querySensors()
            }, 1000 * self.sensor_requery_time)
          }
          if (callback) callback()
        })

        // register for sensor events

      if (this.twoSensorMode) {
        this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_sensor_close), (newValue) => {
          clearTimeout(self.requeryTimer)
          if (self.didMatch(newValue, self.state_sensor_close)) {
            self.log.debug('[SPGDS] close sensor is %s set CurrentDoorState to close', newValue)
            self.currentDoorState.updateValue(Characteristic.CurrentDoorState.CLOSED, null)
            self.targetCommand = false
          } else {
            self.log.debug('[SPGDS] close sensor is %s set TargetDoorState to open CurrentDoorState to opening', newValue)
            if (self.targetCommand) {
              self.targetDoorState.updateValue(Characteristic.TargetDoorState.OPEN)
            }
            self.currentDoorState.updateValue(Characteristic.CurrentDoorState.OPENING, null)
          }
        })

        this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_sensor_open), (newValue) => {
          clearTimeout(self.requeryTimer)
          if (self.didMatch(newValue, self.state_sensor_open)) {
            self.log.debug('[SPGDS] open sensor is %s set CurrentDoorState to open', newValue)
            self.currentDoorState.updateValue(Characteristic.CurrentDoorState.OPEN, null)
            self.targetCommand = false
          } else {
            self.log.debug('[SPGDS] open sensor is %s set TargetDoorState to close CurrentDoorState to closing', newValue)
            if (self.targetCommand) {
              self.targetDoorState.updateValue(Characteristic.TargetDoorState.CLOSED)
            }
            self.currentDoorState.updateValue(Characteristic.CurrentDoorState.CLOSING, null)
          }
        })
      } else {
        this.registerAddressForEventProcessingAtAccessory(this.buildAddress(this.address_sensor_close), (newValue) => {
        // One Sensor Mode
          let match = self.didMatch(newValue, self.state_sensor_close)
          let newState = (match) ? Characteristic.TargetDoorState.CLOSED : Characteristic.TargetDoorState.OPEN
          self.log.debug('[SPGDS] Close sensor hm value is %s set targetDoorState %s', newValue, newState)
          self.targetDoorState.updateValue(newState, null)
          // set the current value 1 second later
          self.timer = setTimeout(() => {
            let newState = (self.didMatch(newValue, self.state_sensor_close)) ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN
            self.log.debug('[SPGDS] timer fired close sensor hm value is %s set new current state %s', newValue, newState)
            self.currentDoorState.updateValue(newState, null)
          }, 1000)
        })
        self.targetCommand = false
      }
    }
  }

  querySensors () {
    if (this.twoSensorMode) {
      this.getValue(this.address_sensor_close, true)
      this.getValue(this.address_sensor_open, true)
    } else {
      this.getValue(this.address_sensor_close, true)
    }
  }

  loadSettings () {
    let settings = this.getDeviceSettings()

    this.address_sensor_close = settings.address_sensor_close
    this.address_sensor_open = settings.address_sensor_open

    this.state_sensor_close = settings.state_sensor_close || true
    this.state_sensor_open = settings.state_sensor_open || true

    this.address_actor_open = settings.address_actor_open
    this.address_actor_close = settings.address_actor_close

    this.delay_actor_open = settings.delay_actor_open || 5
    this.delay_actor_close = settings.delay_actor_close || 5

    let mo = settings.message_actor_open || {'on': 1, 'off': 0}

    if (typeof mo === 'object') {
      this.message_actor_open = mo
    } else {
      this.message_actor_open = this.parseConfigurationJSON(mo, {'on': 1, 'off': 0})
    }

    let mc = settings.message_actor_close || {'on': 1, 'off': 0}

    if (typeof mc === 'object') {
      this.message_actor_close = mc
    } else {
      this.message_actor_close = this.parseConfigurationJSON(mc, {'on': 1, 'off': 0})
    }

    this.sensor_requery_time = settings.sensor_requery_time || 30

    // detect door mode
    // show configuration
    this.twoSensorMode = ((this.address_sensor_close !== undefined) && (this.address_sensor_open !== undefined))
    this.log.debug('[SPGDS] Garage Door Config: %s sensor mode', this.twoSensorMode ? 'two' : 'one')
    if (this.twoSensorMode) {
      this.log.debug('[SPGDS] Sensor open  is %s', this.address_sensor_open)
      this.log.debug('[SPGDS] Sensor open value is %s', this.state_sensor_open)
    }
    this.log.debug('[SPGDS] Sensor close  is %s', this.address_sensor_close)
    this.log.debug('[SPGDS] Sensor close value is %s', this.state_sensor_close)

    this.twoActorMode = ((this.address_actor_open !== undefined) && (this.address_actor_close !== undefined))
    this.log.debug('[SPGDS] Garage Door Config: %s actor mode', this.twoActorMode ? 'two' : 'one')

    this.targetCommand = false

    // validate configuration
    if (this.isDatapointAddressValid(this.address_sensor_close, false) === false) {
      this.log.error('[SPGDS] cannot initialize garage device address for close sensor is invalid')
      return false
    }

    if (this.isDatapointAddressValid(this.address_sensor_open, true) === false) {
      this.log.error('[SPGDS] cannot initialize garage device address for open sensor is invalid')
      return false
    }

    if (this.isDatapointAddressValid(this.address_actor_open, false) === false) {
      this.log.error('[SPGDS] cannot initialize garage device address for open actor is invalid')
      return false
    }

    if (this.isDatapointAddressValid(this.address_actor_close, true) === false) {
      this.log.error('[SPGDS] cannot initialize garage device address for close actor is invalid')
      return false
    }

    return true
  }

  sendActorMessage (address, message, delay) {
    let self = this
    if ((message !== undefined) && (address !== undefined)) {
      if (delay === undefined) {
        this.log.debug('[SPGDS] send Actor Message %s to %s', message, address)

        this.setValue(address, message)
      } else {
        clearTimeout(this.setTimer)
        this.setTimer = setTimeout(() => {
          self.log.debug('[SPGDS] send Actor Message %s to %s', message, address)
          self.setValue(address, message)
        }, 1000 * delay)
      }
    } else {
      this.log.error('[SPGDS] unknown actor or message %s to %s', address, message)
    }
  }

  shutdown () {
    clearTimeout(this.setTimer)
    clearTimeout(this.requeryTimer)
    clearTimeout(this.timer)
    super.shutdown()
  }

  static channelTypes () {
    return ['SPECIAL']
  }

  static configurationItems () {
    return {
      'address_sensor_close': {
        type: 'text',
        label: 'Address close sensor',
        hint: 'Address of the sensor which signals a closed door (mandatory) | Note if you want to use a variable the syntax is V.Varname',
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
        mandatory: true
      },
      'address_actor_close': {
        type: 'text',
        label: 'Address close actor',
        hint: 'Address of the actor which closes the door (optional)',
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

  static serviceDescription () {
    return 'This service provides a garage door opener in HomeKit based on multiple devices from your ccu'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticSPGarageDoorAccessory
