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
