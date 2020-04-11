'use strict'

const xmlrpc = require('homematic-xmlrpc')
const binrpc = require('binrpc')
const EventEmitter = require('events')

class HomeMaticRPCClient {
  constructor (ifName, sysID, hostIP, hostPort, path, log) {
    this.log = log
    this.port = hostPort
    this.host = hostIP
    this.ifName = ifName
    this.sysID = sysID

    if (this.ifName.indexOf('CUxD') > -1) {
      this.log.debug('[RPC] CuxD Extra ....')
      this.client = binrpc.createClient({
        host: hostIP,
        port: hostPort,
        path: path,
        queueMaxLength: 100
      })
      this.protocol = 'xmlrpc_bin://'
    } else {
      this.client = xmlrpc.createClient({
        host: hostIP,
        port: hostPort,
        path: path,
        queueMaxLength: 100
      })
      this.protocol = 'http://'
    }
  }

  init (localIP, listeningPort) {
    let self = this
    this.localIP = localIP
    this.listeningPort = listeningPort
    this.log.debug('[RPC] CCU RPC Init Call on %s port %s for interface %s local server port %s', this.host, this.port, this.ifName, listeningPort)
    var command = this.protocol + this.localIP + ':' + this.listeningPort
    this.ifId = this.sysID + '_' + this.ifName
    this.log.debug('[RPC] init parameter is %s', command)
    this.client.methodCall('init', [command, this.ifId], (error, value) => {
      self.log.debug('[RPC] CCU Response for init at %s with command %s,%s ...Value (%s) Error : (%s)', self.ifName, command, self.ifId, JSON.stringify(value), error)
      self.ping()
    })
  }

  stop () {
    let self = this
    return new Promise((resolve, reject) => {
      self.log.debug('[RPC] disconnecting interface %s', self.ifName)
      self.client.methodCall('init', [self.protocol + self.localIP + ':' + self.listeningPort], (error, value) => {
        if ((error !== undefined) && (error !== null)) {
          self.log.error('[RPC] Error while disconnecting interface %s Error : %s', self.ifName, error)
          reject(error)
        } else {
          self.log.debug('[RPC] interface %s disconnected', self.ifName)
          resolve()
        }
      })
    })
  }

  ping () {
    this.lastMessage = Math.floor((new Date()).getTime() / 1000)
  }
}

class HomeMaticRPC extends EventEmitter {
  constructor (ccumanager, port) {
    super()
    this.log = ccumanager.log
    this.ccumanager = ccumanager
    this.server = undefined
    this.client = undefined
    this.stopped = false
    this.localIP = undefined
    this.bindIP = undefined
    this.listeningPort = port
    this.lastMessage = 0
    this.watchDogTimer = undefined
    this.rpc = undefined
    this.rpcInit = undefined
    this.pathname = '/'
    this.watchDogTimeout = 0
    this.resetInterfaces()
    this.watchDogTimeout = 180
    this.localIP = this.getIPAddress()
  }

  async init () {
    this.server = await this.initServer(xmlrpc, this.listeningPort)
  }

  initServer (module, port) {
    let self = this
    var server
    this.log.debug('[RPC] creating rpc server on port %s', port)
    return new Promise((resolve, reject) => {
      this.isPortTaken(port, (error, inUse) => {
        if (error === null) {
          if (inUse === false) {
            server = module.createServer({
              host: self.localIP,
              port: port
            })

            server.on('NotFound', (method, params) => {
              // self.log.debug("Method %s does not exist. - %s",method, JSON.stringify(params));
            })

            server.on('system.listMethods', (err, params, callback) => {
              if (self.stopped === false) {
                let iface = self.interfaceForEventMessage(params)
                if (iface) {
                  self.log.debug("[RPC] Method call params for 'system.listMethods': %s (%s)", JSON.stringify(params), err)
                } else {
                  self.log.error('[RPC] unable to find Interface for %s', params)
                }
              } else {
                self.log.error('[RPC] Modul is not running ignore call')
              }
              callback(null, ['event', 'system.listMethods', 'system.multicall'])
            })

            server.on('listDevices', (err, params, callback) => {
              if (self.stopped === false) {
                let iface = self.interfaceForEventMessage(params)
                if (iface) {
                  self.log.debug('[RPC] <- listDevices on %s - Zero Reply (%s)', iface.ifName, err)
                }
              } else {
                self.log.error('[RPC] Modul is not running ignore call')
              }
              callback(null, [])
            })

            server.on('newDevices', (err, params, callback) => {
              if (self.stopped === false) {
                let iface = self.interfaceForEventMessage(params)
                if (iface) {
                  self.log.debug('[RPC] <- newDevices on %s. Emit this for the ccu to requery rega', iface.ifName, err)
                  self.emit('newDevices', {})
                }
                // we are not intrested in new devices cause we will fetch them at launch
              }
              callback(null, [])
            })

            server.on('event', (err, params, callback) => {
              if (self.stopped === false) {
                if (!err) {
                  let iface = self.interfaceForEventMessage(params)
                  if (iface) {
                    iface.ping()
                    self.handleEvent(iface, 'event', params)
                  } else {
                    self.log.error('[RPC]  event unable to find Interface for %s', params)
                  }
                }
              }
              callback(err, [])
            })

            server.on('system.multicall', (err, params, callback) => {
              if ((self.stopped === false) && (!err)) {
                params.map((events) => {
                  try {
                    events.map((event) => {
                      let iface = self.interfaceForEventMessage(event.params)
                      if (iface) {
                        iface.ping()
                        self.handleEvent(iface, event.methodName, event.params)
                      } else {
                        self.log.error('[RPC] multiCall unable to find Interface for %s', JSON.stringify(event.params))
                      }
                    })
                  } catch (err) { }
                })
              }
              callback(null)
            })

            self.log.info('[RPC] server for all interfaces is listening on port %s.', port)
            resolve(server)
          } else {
            self.log.error('****************************************************************************************************************************')
            self.log.error('*  Sorry the local port %s on your system is in use. Please make sure, self no other instance of this plugin is running.', port)
            self.log.error('*  you may change the initial port with the config setting for local_port in your config.json ')
            self.log.error('*  giving up ... the homematic plugin is not able to listen for ccu events on %s until you fix this. ')
            self.log.error('****************************************************************************************************************************')
            reject(new Error('port in use error'))
          }
        } else {
          self.log.error('*  Error while checking ports')
          reject(new Error('port check error'))
        }
      })
    })
  }

  interfaceForEventMessage (params) {
    var result
    if ((params) && (params.length > 0)) {
      let ifTest = params[0]
      this.interfaces.map(iface => {
        if (iface.ifId === ifTest) {
          result = iface
        }
        // this is the cuxd extra handling cause cuxd is not rega compliant and returns alwas CUxD instead of the interface identifier from the init call
        if ((ifTest === 'CUxD') && ((iface.ifName.indexOf('CUxD') > -1))) {
          result = iface
        }
      })
    }
    return result
  }

  handleEvent (iface, method, params) {
    let self = this
    if ((method === 'event') && (params !== undefined)) {
      let ifName = iface.ifName
      let channel = ifName + params[1]
      let datapoint = params[2]
      let value = params[3]

      let rgx = /([a-zA-Z0-9-]{1,}).([a-zA-Z0-9-]{1,}):([0-9]{1,}).([a-zA-Z0-9-_]{1,})/g
      let parts = rgx.exec(channel + '.' + datapoint)
      if ((parts) && (parts.length > 4)) {
        let idx = parts[1]
        let address = parts[2]
        let chidx = parts[3]
        let evadr = idx + '.' + address + ':' + chidx + '.' + datapoint
        self.log.debug('[RPC] event for %s.%s with value %s', channel, datapoint, value)
        self.emit('event', {address: evadr, value: value})
      }
    }
  }

  addInterface (ifName, hostIP, hostPort, path) {
    if (!ifName.endsWith('.')) {
      ifName = ifName + '.'
    }
    // PowerUP rpc bin if needed
    if ((ifName.indexOf('CUxD') > -1) && (!(this.binServer))) {
      this.log.debug('[RPC] open extra Connector for CuxD')
      this.binServer = this.initServer(binrpc, this.listeningPort + 1)
      this.log.debug('[RPC] Connector for CuxD is done')
    }

    this.log.debug('[RPC] adding Interface %s Host %s Port %s Path %s', ifName, hostIP, hostPort, path)
    let client = new HomeMaticRPCClient(ifName, 'HAP', hostIP, hostPort, path, this.log)
    this.interfaces.push(client)
  }

  connect () {
    let self = this
    this.log.debug('[RPC] Connecting all interfaces')
    this.interfaces.map(iface => {
      let port = self.listeningPort
      if (iface.ifName.indexOf('CUxD') > -1) {
        port = port + 1
      }
      self.log.debug('[RPC] init interface %s for connection to port %s', iface.ifName, port)
      iface.init(self.localIP, port)
      iface.serverPort = port
    })

    if (this.watchDogTimeout > 0) {
      this.log.debug('[RPC] init watchdog %s seconds', this.watchDogTimeout)
      this.ccuWatchDog()
    }
    this.stopping = false
  }

  ccuWatchDog () {
    var self = this
    this.interfaces.map(iface => {
      if (iface.lastMessage !== undefined) {
        var now = Math.floor((new Date()).getTime() / 1000)
        var timeDiff = now - iface.lastMessage
        if (timeDiff > self.watchDogTimeout) {
          self.log.debug('[RPC] Watchdog Trigger - Reinit Connection for %s after idle time of %s seconds', iface.ifName, timeDiff)
          self.lastMessage = now
          iface.stop()
          iface.init(self.localIP, iface.serverPort)
        }
      }
    })

    var recall = () => {
      self.ccuWatchDog()
    }

    this.watchDogTimer = setTimeout(recall, 10000)
  }

  disconnectInterfaces () {
    let self = this
    if (this.stopped) {
      return
    }
    clearTimeout(this.watchDogTimeout)
    this.stopped = true
    return Promise.all(self.interfaces.map(async (iface) => {
      await iface.stop()
    })
    )
  }

  resetInterfaces () {
    this.log.debug('[RPC] reseting all interface connections')
    this.interfaces = []
    this.stopped = false
  }

  async stop () {
    let self = this
    await this.disconnectInterfaces()

    this.log.debug('[RPC] closing eventserver')
    this.server.close(() => {
      self.log.debug('[RPC] eventserver removed')
    })
    if (this.binServer) {
      this.binServer.close()
    }
  }

  getIPAddress () {
    const os = require('os')
    var interfaces = os.networkInterfaces()

    for (var devName in interfaces) {
      var iface = interfaces[devName]
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i]

        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && (alias.address.indexOf('169.254.') === -1)) {
          return alias.address
        }
      }
    }
    return '0.0.0.0'
  }

  // checks if the port is in use
  // https://gist.github.com/timoxley/1689041

  isPortTaken (port, fn) {
    var net = require('net')
    var tester = net.createServer().once('error', (err) => {
      if (err.code !== 'EADDRINUSE') return fn(err)
      fn(null, true)
    })
      .once('listening', () => {
        tester.once('close', () => {
          fn(null, false)
        })
          .close()
      }).listen(port)
  }
}

module.exports = HomeMaticRPC
