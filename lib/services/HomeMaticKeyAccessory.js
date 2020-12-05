/*
 * File: HomeMaticKeyAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 8th March 2020 7:00:35 pm
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

// this Accessory will spawn a event to the Server if set
// usefull for reloading action
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticKeyAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.switch = this.getService(Service.StatelessProgrammableSwitch)
    this.keyEvent = this.switch.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    this.initialQueryShort = true
    this.initialQueryLong = true

    this.buildKeys('PRESS_SHORT', 0, self.PressShortMessage, this.initialQueryShort)
    this.buildKeys('PRESS_LONG', 2, self.PressLongMessage, this.initialQueryLong)

    this.buildKeys('PRESS', 0, self.PressShortMessage, this.initialQueryShort)

    if (this.deviceServiceSettings('voltage')) {
      this.addLowBatCharacteristic()
    }
  }

  async buildKeys (datapoint, homeKitMessage, message, initQuery) {
    let self = this
    if (await this._ccu.hazDatapoint(this.buildAddress(datapoint))) {
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress(datapoint), (newValue) => {
        if (!initQuery) {
          self.log.info('%s Event send %s', datapoint, homeKitMessage)
          self.keyEvent.updateValue(homeKitMessage, null)
          if (message) {
            self.emit(message)
          }
        } else {
          self.debugLog('Scrub due initial query')
        }
        initQuery = false
      })
    }
  }

  static channelTypes () {
    return ['KEY', 'VIRTUAL_KEY', 'KEY_TRANSCEIVER', 'MULTI_MODE_INPUT_TRANSMITTER', 'SWITCH_INTERFACE']
  }

  initServiceSettings () {
    return {
      'HmIP-KRCA': {
        voltage: 1.2
      }
    }
  }

  static serviceDescription () {
    return 'This service provides a programmable switch in HomeKit based on a ccu KEY'
  }

  static filterDevice () {
    return ['HmIP-ASIR', 'HmIP-ASIR-B1', 'HmIP-ASIR-2', 'HmIP-ASIR-O', 'HmIP-BBL']
  }
}
module.exports = HomeMaticKeyAccessory
