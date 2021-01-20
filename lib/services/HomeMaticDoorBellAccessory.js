/*
 * File: HomeMaticDoorBellAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 29th March 2020 1:35:00 pm
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

class HomeMaticDoorBellAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let service = this.addService(new Service.Doorbell(this._name))
    this.keyEvent = service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    this.initialQuery = true

    this.buildKeys('PRESS_SHORT', 0, this.initialQuery)
    this.buildKeys('PRESS', 0, this.initialQuery)
  }

  async buildKeys (datapoint, homeKitMessage, initQuery) {
    let self = this
    if (await this._ccu.hazDatapoint(this.buildAddress(datapoint))) {
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress(datapoint), (newValue) => {
        if (!self.initialQuery) {
          self.keyEvent.updateValue(homeKitMessage, null)
        }
        self.initialQuery = false
      })
    }
  }
  static channelTypes () {
    return ['KEY', 'VIRTUAL_KEY', 'SWITCH_INTERFACE', 'MULTI_MODE_INPUT_TRANSMITTER', 'KEY_TRANSCEIVER']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }

  static serviceDescription () {
    return 'This service provides a door bell in HomeKit, based on a KEY event at your CCU'
  }

  static filterDevice () {
    return ['HmIP-ASIR', 'HmIP-ASIR-B1', 'HmIP-ASIR-2', 'HmIP-ASIR-O', 'HmIP-BBL']
  }

  static getPriority () {
    return 1
  }
}

module.exports = HomeMaticDoorBellAccessory
