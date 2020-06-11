/*
 * File: HomeMaticVarBasedElectricConsumptionAccessory.js
 * Project: hap-homematic
 * File Created: Wednesday, 10th June 2020 9:25:27 pm
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

class HomeMaticVarBasedElectricConsumptionAccessory extends HomeMaticAccessory {
  constructor (channel, sInterface, server, settings = {}) {
    super(channel, sInterface, server, settings)
    this._ccuType = 'POWERMETER_IGL'
  }

  publishServices (Service, Characteristic) {
    let self = this
    this.service = this.getService(this.eve.Service.EnergyMeterService)
    let settings = this.getDeviceSettings()
    this.requery_time = (settings.requery_time !== undefined) ? parseInt(settings.requery_time) : 60
    this.factor = (settings.factor !== undefined) ? parseInt(settings.factor) : 1

    this.enableLoggingService('energy')

    this.energyCounter = this.service.getCharacteristic(this.eve.Characteristic.TotalConsumption)
      .on('get', async (callback) => {
        let newValue = await self._ccu.getVariableValue(self.nameInCCU)
        if (callback) callback(null, Number((parseFloat(newValue) * self.factor).toFixed(1)))
      })

    this.energyCounter.eventEnabled = true

    this.queryData()
  }

  async queryData () {
    clearTimeout(this.refreshTimer)
    var self = this
    let newValue = await this._ccu.getVariableValue(this.nameInCCU)
    if ((this.energyCounter) && (newValue != null)) {
      let value = Number((parseFloat(newValue) * self.factor).toFixed(1))
      this.updateCharacteristic(this.energyCounter, value)
      this.addLogEntry({power: value})
    }

    this.refreshTimer = setTimeout(() => {
      self.queryData()
    }, self.requery_time * 60 * 1000)
  }

  updateVariable () {
    this.queryData()
  }

  shutdown () {
    this.log.debug('[VBPM] shutdown')
    super.shutdown()
    clearTimeout(this.refreshTimer)
  }

  static channelTypes () {
    return ['VARIABLE']
  }

  static serviceDescription () {
    return 'This service provides a power comsumption sensor HomeKit based on a variable from your ccu'
  }

  static configurationItems () {
    return {
      'requery_time': {
        type: 'number',
        default: 60,
        label: 'Variable requery time',
        hint: 'Time (min) the variable will be queried again to fetch a new data.',
        mandatory: false
      },
      'factor': {
        type: 'number',
        default: 1,
        label: 'Factor',
        hint: 'Eve wants kwH,and the value of your variable will be multiplied with this factor, so here u are able to do the math.',
        mandatory: false
      }
    }
  }
}

module.exports = HomeMaticVarBasedElectricConsumptionAccessory
