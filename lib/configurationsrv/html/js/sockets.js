/*
 * File: sockets.js
 * Project: hap-homematic
 * File Created: Tuesday, 12th May 2020 5:56:08 pm
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

 export class HAPWebSockets {
  
    sendSocketMessage (command, options) {
      this.sock.sendSocketMessage(command, options)
    }
  
    initSocket (cb) {
    this.callback = cb
    this.sock = undefined
    this.initCallbackCalled = false
    this.restoretimer = undefined
    this.restoreSocket()
  }
  
  processServerMessage (message) {
    let msgObject = JSON.parse(message)
    if (msgObject) {
          this.callback(this,msgObject)
    }
  }

  restoreSocket () {
    try {
      // kill all the stuff
      let self = this
      this.sock = undefined
  
      this.sock = new SockJS('/websockets')
      this.sock.onopen =  () => {
        clearTimeout(this.restoretimer)
          self.sock.send(JSON.stringify({
            command: 'hello'
          }))
        }
  
        if ((self.callback) && (self.initCallbackCalled === false)) {
          self.initCallbackCalled = true
          self.callback(self,undefined)
        }
      
      this.sock.onclose =  (e) => {
        // Connection close - wait 2 seconds
        console.log('Socket Close ' + e.code)
  
        if (e.code === 1006) {
          setTimeout(() => {
            console.log('Restore Socket')
            self.restoreSocket()
          }, 2000)
          return
        }
        // Connection cannot reestablish -- wait 10 seconds
        if (e.code === 1002) {
          setTimeout(() => {
            console.log('Restore Socket')
            self.restoreSocket()
          }, 10000)
        }
      }
      this.sock.onmessage =  (e) => {
        self.processServerMessage(e.data)
      }
    } catch (e) {}
  }
}
