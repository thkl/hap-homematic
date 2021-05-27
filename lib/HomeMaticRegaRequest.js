/*
 * File: HomeMaticRegaRequest.js
 * Project: hap-homematic
 * File Created: Saturday, 7th March 2020 2:30:06 pm
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
'use strict'

var http = require('http')

class HomeMaticRegaRequest {
  constructor(log, ccuIP = '127.0.0.1') {
    this.log = log
    this.ccuIP = ccuIP
    this.timeout = 120
  }

  script(script) {
    var self = this
    return new Promise((resolve, reject) => {
      self.log.info('[Rega] RegaScript %s', script)

      var ls = script

      var postOptions = {
        host: this.ccuIP,
        port: '8181',
        path: '/tclrega.exe',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': script.length
        }
      }

      try {
        var postReq = http.request(postOptions, (res) => {
          var data = ''
          res.setEncoding('binary')

          res.on('data', (chunk) => {
            data += chunk.toString()
          })

          res.on('end', () => {
            var pos = data.lastIndexOf('<xml><exec>')
            var response = (data.substring(0, pos))
            self.log.info('[Rega] result is %s', response)
            resolve(response)
          })
        })
      } catch (e) {
        self.log.error(e)
        reject(new Error('Rega request Error'))
      }

      postReq.on('error', (e) => {
        self.log.error('[Rega] Error ' + e + 'while executing rega script ' + ls)
        reject(e)
      })

      postReq.on('timeout', (e) => {
        self.log.error('[Rega] timeout while executing rega script')
        postReq.destroy()
        reject(new Error('TimeOut'))
      })

      postReq.setTimeout(this.timeout * 1000)

      postReq.write(script)
      postReq.end()
    })
  }

  getValue(hmadr) {
    return new Promise((resolve, reject) => {
      var script = 'var d = dom.GetObject("' + hmadr.address() + '");if (d){Write(d.Value());}'
      this.script(script, (data) => {
        if (data !== undefined) {
          resolve(data)
        } else {
          reject(new Error('Invalid Data from Rega'))
        }
      })
    })
  }

  setValue(hmadr, value) {
    return new Promise((resolve, reject) => {
      // check explicitDouble
      if (typeof value === 'object') {
        let v = value['explicitDouble']
        if (v !== undefined) {
          value = v
        }
      }
      this.log.debug('Rega SetValue %s of %s', value, hmadr.address())
      var script = 'var d = dom.GetObject("' + hmadr.address() + '");if (d){d.State("' + value + '");}'
      this.script(script).then(data => resolve(data))
    })
  }

  setVariable(channel, value, callback) {
    return new Promise((resolve, reject) => {
      var script = 'var d = dom.GetObject("' + channel + '");if (d){d.State("' + value + '");}'
      this.script(script).then(data => resolve(data))
    })
  }

  getVariable(channel) {
    return new Promise((resolve, reject) => {
      var script = 'var d = dom.GetObject("' + channel + '");if (d){Write(d.State());}'
      this.script(script).then(data => resolve(data))
    })
  }

  isInt(n) {
    return Number(n) === n && n % 1 === 0
  }

  isFloat(n) {
    return n === Number(n) && n % 1 !== 0
  }
}

module.exports = HomeMaticRegaRequest
