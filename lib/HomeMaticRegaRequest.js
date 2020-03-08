'use strict'

var http = require('http')

class HomeMaticRegaRequest {
  constructor (log) {
    this.log = log
    this.ccuIP = '127.0.0.1'
    this.timeout = 120
  }

  script (script) {
    var self = this
    return new Promise((resolve, reject) => {
      self.log.debug('[Rega] RegaScript %s', script)

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

      var postReq = http.request(postOptions, function (res) {
        var data = ''
        res.setEncoding('binary')

        res.on('data', function (chunk) {
          data += chunk.toString()
        })

        res.on('end', function () {
          var pos = data.lastIndexOf('<xml><exec>')
          var response = (data.substring(0, pos))
          self.log.debug('[Rega] result is %s', response)
          resolve(response)
        })
      })

      postReq.on('error', function (e) {
        self.log.error('[Rega] Error ' + e + 'while executing rega script ' + ls)
        reject(e)
      })

      postReq.on('timeout', function (e) {
        self.log.error('[Rega] timeout while executing rega script')
        postReq.destroy()
        reject(new Error('TimeOut'))
      })

      postReq.setTimeout(this.timeout * 1000)

      postReq.write(script)
      postReq.end()
    })
  }

  getValue (hmadr) {
    return new Promise((resolve, reject) => {
      var script = 'var d = dom.GetObject("' + hmadr.address() + '");if (d){Write(d.Value());}'
      this.script(script, function (data) {
        if (data !== undefined) {
          resolve(data)
        } else {
          reject(new Error('Invalid Data from Rega'))
        }
      })
    })
  }

  setValue (hmadr, value) {
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

  setVariable (channel, value, callback) {
    return new Promise((resolve, reject) => {
      var script = 'var d = dom.GetObject("' + channel + '");if (d){d.State("' + value + '");}'
      this.script(script).then(data => resolve(data))
    })
  }

  getVariable (channel) {
    return new Promise((resolve, reject) => {
      var script = 'var d = dom.GetObject("' + channel + '");if (d){Write(d.State());}'
      this.script(script).then(data => resolve(data))
    })
  }

  isInt (n) {
    return Number(n) === n && n % 1 === 0
  }

  isFloat (n) {
    return n === Number(n) && n % 1 !== 0
  }
}

module.exports = HomeMaticRegaRequest
