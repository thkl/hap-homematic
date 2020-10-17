/*
 * File: HomeMaticSwitchAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 7th March 2020 1:46:37 pm
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

class HomeMaticSwitchAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var service
    let subType = this.getDeviceSettings().Type || 'Lightbulb'
    let onTime = this.getDeviceSettings().OnTime
    let readOnly = this.isReadOnly()

    switch (subType) {
      case 'Outlet':
        service = this.getService(Service.Outlet)
        break
      case 'Switch':
        service = this.getService(Service.Switch)
        break
      case 'Fan':
        service = this.getService(Service.Fan)
        break
      default:
        service = this.getService(Service.Lightbulb)
        break
    }

    this.debugLog('[SWITCH] creating Service %s', subType)
    this.isOnCharacteristic = service.getCharacteristic(Characteristic.On)

    this.isOnCharacteristic.on('get', (callback) => {
      self.getValue('STATE', true).then(value => {
        callback(null, self.isTrue(value))
      })
    })

    this.isOnCharacteristic.on('set', async (value, callback) => {
      if (!readOnly) {
        self.debugLog('[Switch] set switch %s', value)
        if ((value === true) && (onTime) && (parseInt(onTime) > 0)) {
          self.debugLog('set onTime %s seconds', onTime)
          await self.setValue('ON_TIME', onTime)
        }
        self.debugLog('set value %s', value)
        if (value === false) {
          self.setValue('STATE', 0)
        } else {
          self.setValue('STATE', 1)
        }
      } else {
        // check the state to reset the HomeKit State
        self.debugLog('[Switch] is readOnly .. skipping')
        setTimeout(() => {
          self.getValue('STATE', true)
        }, 1000)
      }
      callback()
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      self.debugLog('[SWITCH] event state %s', newValue)
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
      this.addLastActivationService(this.loggingService)
    }

    if (this._deviceType === 'HM-Dis-TD-T') {
      this.addLowBatCharacteristic()
    }
  }

  static channelTypes () {
    return ['SWITCH', 'STATUS_INDICATOR', 'SWITCH_VIRTUAL_RECEIVER', 'VIR-LG-ONOFF-CH']
  }

  static serviceDescription () {
    return 'This service provides a switch'
  }

  static configurationItems () {
    return {
      'Type': {
        type: 'option',
        array: ['Lightbulb', 'Outlet', 'Switch', 'Fan'],
        default: 'Lightbulb',
        label: 'Subtype of this device',
        hint: 'A switch can have different sub types'
      },
      'OnTime': {
        type: 'number',
        default: 0,
        label: 'On Time',
        hint: 'HAP will switch off this device automatically after the given seconds. Set this to 0 to turn off this feature.'
      }
    }
  }
}

module.exports = HomeMaticSwitchAccessory
