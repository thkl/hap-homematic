/*
 * File: HomeMaticVarBasedThermometerAccessory.js
 * Project: hap-homematic
 * File Created: Tuesday, 28th April 2020 7:25:44 pm
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

class HomeMaticVarBasedThermometerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.thermometer = this.getService(Service.TemperatureSensor)
    this.enableLoggingService('weather')

    this.cctemp = this.thermometer.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', async (callback) => {
        let newValue = await self._ccu.getVariableValue(self.nameInCCU)
        if (callback) callback(null, parseFloat(newValue))
      })

    this.cctemp.eventEnabled = true
    this.queryData()
  }

  async queryData () {
    var self = this
    let newValue = await this._ccu.getVariableValue(this.nameInCCU)
    if ((this.cctemp) && (newValue != null)) {
      this.cctemp.updateValue(parseFloat(newValue), null)
      this.addLogEntry({temp: parseFloat(newValue), pressure: 0, humidity: 1})
    }

    this.refreshTimer = setTimeout(() => {
      self.queryData()
    }, 10 * 60 * 1000)
  }

  updateVariable () {
    this.queryData()
  }

  shutdown () {
    this.log.debug('[VBT] shutdown')
    super.shutdown()
    clearTimeout(this.refreshTimer)
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a temperature sensor HomeKit based on a variable from your ccu'
  }

  static configurationItems () {
    return {
    }
  }
}

module.exports = HomeMaticVarBasedThermometerAccessory
