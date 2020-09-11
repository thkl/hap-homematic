/*
 * File: HomeMaticSPCCUTempAccessory.js
 * Project: hap-homematic
 * File Created: Wednesday, 29th April 2020 4:23:16 pm
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
const fs = require('fs')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSPCCUTempAccessory extends HomeMaticAccessory {
  constructor (channel, sInterface, server, settings = {}) {
    super(channel, sInterface, server, settings)
    this._ccuType = 'WEATHER'
  }

  publishServices (Service, Characteristic) {
    let self = this

    this.thermometer = this.getService(Service.TemperatureSensor)
    this.enableLoggingService('weather')

    this.cctemp = this.thermometer.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100
      })
      .on('get', async (callback) => {
        let newValue = await self.readTemperature()
        if (callback) callback(null, parseFloat(newValue).toFixed(2))
      })

    this.cctemp.eventEnabled = true
    this.queryData()
  }

  async queryData () {
    var self = this
    let newValue = await self.readTemperature()
    if ((this.cctemp) && (newValue != null)) {
      this.cctemp.updateValue(Number(parseFloat(newValue).toFixed(2)), null)
      this.addLogEntry({temp: Number(parseFloat(newValue).toFixed(2)), pressure: 0, humidity: 1})
    }

    this.refreshTimer = setTimeout(() => {
      self.queryData()
    }, 5 * 60 * 1000)
  }

  readTemperature () {
    var coreTemperature = 0
    let fileName = '/sys/class/thermal/thermal_zone0/temp'
    try {
      if (fs.existsSync(fileName)) {
        coreTemperature = parseFloat(fs.readFileSync(fileName))
        return (coreTemperature / 1000)
      }
    } catch (e) {
      return 0
    }
  }

  static validate (configurationItem) {
    return false
  }

  shutdown () {
    clearTimeout(this.refreshTimer)
    super.shutdown()
  }

  static channelTypes () {
    return ['SPECIAL']
  }

  static serviceDescription () {
    return 'This service provides a thermometer which will show your current ccu processor temperature'
  }

  static configurationItems () {
    return {
      'showGraph': {
        type: 'option',
        array: ['DONT_SHOW', 'temp'],
        default: 'DONT_SHOW',
        label: 'Show graph',
        hint: 'Show measured values as graph on the frontpage'
      }
    }
  }
}

module.exports = HomeMaticSPCCUTempAccessory
