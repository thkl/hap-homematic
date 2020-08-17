/*
 * File: HomeMaticSPHTTPAccessory.js
 * Project: hap-homematic
 * File Created: Monday, 17th August 2020 5:15:47 pm
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
const http = require('http')
const https = require('https')
const url = require('url')

const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticSPHTTPAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    let callUrl = this.getDeviceSettings('url')

    let service = this.addService(new Service.Switch(this._name))
    let isOn = service.getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        if (callback) callback(null, false)
      })
      .on('set', async (value, callback) => {
        callback()
        try {
          await self.getHTTP(callUrl)
        } catch (e) {

        }
        setTimeout(() => {
          isOn.updateValue(false, null)
        }, 500)
      })
  }

  getHTTP (urlStr) {
    let self = this
    return new Promise((resolve, reject) => {
      let options = {}
      let q = url.parse(urlStr, true)
      options.path = q.pathname
      options.host = q.hostname
      options.port = q.port

      let req = q.protocol === 'https:' ? https : http
      self.debugLog('calling url %s with protocol %s', urlStr, q.protocol)
      req.get(options, (resp) => {
        let data = ''

        resp.on('data', (chunk) => {
          data += chunk
        })

        resp.on('end', () => {
          resolve(data)
        })
      }).on('error', (err) => {
        self.log.error('[HomeMaticSPHTTPAccessory] error while calling url %s (%s)', urlStr, err)
        reject(err)
      })
    })
  }

  static channelTypes () {
    return ['SPECIAL']
  }

  static configurationItems () {
    return {
      'url': {
        type: 'text',
        default: 'https://google.com',
        label: 'Url',
        hint: 'The url for the GET Request'
      }
    }
  }

  static getPriority () {
    return 1
  }

  static serviceDescription () {
    return 'This service provides a switch HomeKit which will call a url'
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticSPHTTPAccessory
