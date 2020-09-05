/*
 * File: HomeMaticSPCCUDutyCycleAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 13th June 2020 10:13:05 am
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

class HomeMaticSPCCUDutyCycleAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let settings = this.getDeviceSettings()
    this.dcAddress = settings.dcAddress || ''
    this.service = this.getService(Service.HumiditySensor)
    this.char = this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity)
    this.active = this.service.getCharacteristic(Characteristic.StatusActive)
    this.enableLoggingService('weather', false)

    this.char.on('get', async (callback) => {
      let homeKitState = 0
      let dcDevices = await self._ccu.getCCUDutyCycle()
      if ((dcDevices) && (dcDevices[self.dcAddress])) {
        self.log.debug('[SPDDC] update dc %s', parseFloat(dcDevices[self.dcAddress]))
        homeKitState = parseFloat(dcDevices[self.dcAddress])

        self.addLogEntry({
          temp: 0, pressure: 0, humidity: homeKitState
        })
      }
      callback(null, homeKitState)
    })
    this.char.eventEnabled = true

    this.active.on('get', (callback) => {
      callback(null, true)
    })

    this.updateCharacteristic(this.active, true)

    // we have to wait until the final inizialization is completed
    this.timer = setTimeout(() => {
      self.updateDC()
    }, 15000)
  }

  shutdown () {
    super.shutdown()
    clearTimeout(this.timer)
  }

  async updateDC () {
    let self = this
    clearTimeout(this.timer)
    // Fetch DC from CCU will get all used IF Devices
    let dcDevices = await this._ccu.getCCUDutyCycle()
    this.log.debug('[SPDDC] DC data %s used if %s', JSON.stringify(Object.keys(dcDevices)), this.dcAddress)
    if ((this.char) && (dcDevices) && (dcDevices[this.dcAddress])) {
      this.log.debug('[SPDDC] update dc %s', parseFloat(dcDevices[this.dcAddress]))
      let homeKitState = parseFloat(dcDevices[this.dcAddress])
      this.updateCharacteristic(this.char, homeKitState)

      if ((this.loggingService) && (this.lastValue !== homeKitState)) {
        this.log.debug('[SPDDC] adding log %s', homeKitState)
        this.addLogEntry({
          temp: 0, pressure: 0, humidity: homeKitState
        })
      }
      this.initialQuery = false
      this.lastValue = homeKitState
    }
    this.timer = setTimeout(
      () => {
        self.updateDC()
      }, 5 * 60 * 1000)
  }

  static channelTypes () {
    return ['SPECIAL']
  }

  static serviceDescription () {
    return 'This service provides duty cycle measurement'
  }

  static async configurationItems (ccu) {
    let dcDevices = []
    if (ccu) {
      dcDevices = await ccu.getCCUDutyCycle(true)
    }
    return {
      'dcAddress': {
        type: 'option',
        array: Object.keys(dcDevices),
        label: 'CCU / Gateway',
        hint: 'Which device should be used'
      }
    }
  }
  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticSPCCUDutyCycleAccessory
