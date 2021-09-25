/*
 * File: HomematicSPMultiKeyAccessory.js
 * Project: hap-homematic
 * File Created: Wednesday, 12th August 2020 6:37:29 pm
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

class HomeMaticSPMultiChannelKeyAccessory extends HomeMaticAccessory {
  publishServices(Service, Characteristic) {
    let self = this
    let settings = this.getDeviceSettings()
    if ((settings) && (settings.key)) {
      Object.keys(settings.key).map((aKey) => {
        let cadr = settings.key[aKey]
        self.createKeyService(self._name, cadr, Service, Characteristic)
      })
    }
  }

  createKeyService(name, homeMaticChannel, Service, Characteristic) {
    let self = this
    let cn = this._ccu.getChannelByAddress(homeMaticChannel)
    if (cn === undefined) {
      return;
    }
    let ifId = this._ccu.getInterfaceWithID(cn.intf)

    // Adding Press Short
    let dpCmpl = ifId.name + '.' + homeMaticChannel + '.PRESS_SHORT'

    if (this.isDatapointAddressValid(dpCmpl, false) === true) {
      this.debugLog('Adding Key %s with name %s', dpCmpl, cn.name)
      let switchService = this.getService(Service.StatelessProgrammableSwitch, cn.name, true, cn.name)
      let keyCharacteristic = switchService.getCharacteristic(Characteristic.ProgrammableSwitchEvent)

      this.registerAddressForEventProcessingAtAccessory(this.buildAddress(dpCmpl), (newValue) => {
        self.debugLog('Press Short Event for %s', dpCmpl)
        keyCharacteristic.updateValue(0, null)
      })

      dpCmpl = ifId.name + '.' + homeMaticChannel + '.PRESS_LONG'
      this.registerAddressForEventProcessingAtAccessory(this.buildAddress(dpCmpl), (newValue) => {
        self.debugLog('Press Long Event for %s', dpCmpl)
        keyCharacteristic.updateValue(2, null)
      })
    } else {
      self.debugLog('%s is not a valid datapoint', dpCmpl)
    }
  }

  static channelTypes() {
    return ['SPECIAL']
  }

  static configurationItems() {
    return {
      'key': {
        type: 'text_control_array',
        label: 'Address of the Key Channel',
        hint: '',
        selector: 'channel',
        options: { filterChannels: ['KEY', 'VIRTUAL_KEY', 'KEY_TRANSCEIVER'] },
        mandatory: true
      }
    }
  }

  static serviceDescription() {
    return 'This service provides multiple HomeMatic Keys in one device.'
  }
  static validate(configurationItem) {
    return false
  }
}

module.exports = HomeMaticSPMultiChannelKeyAccessory
