/*
 * File: index.js
 * Project: hap-homematic
 * File Created: Tuesday, 10th March 2020 7:15:57 pm
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
const os = require('os')
const path = require('path')
const fs = require('fs')
const http = require('http')
const crypto = require('crypto')
const https = require('https')
const url = require('url')
const qs = require('querystring')
const uuid = require('hap-nodejs').uuid
const Logger = require(path.join(__dirname, '..', 'logger.js'))
const Rega = require(path.join(__dirname, '..', 'HomeMaticRegaRequest.js'))
const sockjs = require('sockjs')

process.title = 'hap-homematic-config'

class ConfigurationService {
  constructor(logger) {
    this.log = logger
    this.configServerPort = 9874

    this.contentTypesByExtension = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.json': 'application/json; charset=utf-8',
      '.mp3': 'audio/mpeg',
      '.gif': 'image/gid',
      '.gz': 'application/gzip',
      '.ico': 'image/x-icon',
      '.woff2': 'font/opentype',
      '.woff': 'font/opentype',
      '.ttf': 'font/opentype',
      '.mp4': 'video/mp4'
    }
    this.programs = []
    this.variables = []
    this.pluginAccessories = []
    this.bridges = []
    this.allVariables = []
    this.compatibleDevices = []

    let config = this.loadSettings()
    if (config === undefined) {
      config = {}
    }
    this.useAuth = config.useCCCAuthentication || false
    this.useTLS = config.useTLS || false
    this.interfaceWatchdog = config.interfaceWatchdog || 300
    this.enableMonitoring = config.enableMonitoring || false
    this.disableHistory = config.disableHistory || false
    this.forceCache = config.forceCache || false
    this.forceRefresh = false
  }

  shutdown() {
    this.server.close()
    this.log.close()
  }

  sendFile(unsafeSuffix, response) {
    var safeSuffix = path.normalize(unsafeSuffix).replace(/^(\.\.(\/|\\|$))+/, '')
    var safeFilePath = path.join(__dirname, 'html', safeSuffix)

    if (safeFilePath.endsWith('/')) {
      safeFilePath = path.join(safeFilePath, 'index.html')
    }

    if (fs.existsSync(safeFilePath)) {
      let stat = fs.statSync(safeFilePath)
      let contentType = this.contentTypesByExtension[path.extname(safeFilePath)]

      response.writeHead(200, {
        'Content-Type': contentType || 'text/html',
        'Content-Length': stat.size,
        'Last-Modified': new Date()
      })

      var readStream = fs.createReadStream(safeFilePath)
      readStream.pipe(response)
    } else {
      this.log.warn('File not found %s', safeFilePath)
      response.writeHead(404, { 'Content-Type': 'text/plain' })
      response.end('ERROR File does not exist')
    }
  }

  sendJSON(object, response) {
    response.writeHead(200, {
      'Content-Type': 'application/json'
    })
    response.end(JSON.stringify(object))
  }
  async run() {
    let self = this

    function serverHandler(request, response) {
      if (request.url === '/restore/' && request.method.toLowerCase() === 'post') {
        self.processRestore(request, response)
      } else
        if (request.method === 'POST') {
          var body = ''
          request.on('data', (data) => {
            body += data
            if (body.length > 1e6) {
              request.connection.destroy()
            }
          })

          request.on('end', () => {
            let parsed = url.parse(request.url, true)
            let post = qs.parse(body)
            let filename = parsed.pathname
            if (filename === '/api/') {
              self.processApiCall(post, response)
            } else {
              self.sendFile(filename, response)
            }
          })
        } else {
          let parsed = url.parse(request.url, true)
          let filename = parsed.pathname
          if (filename === '/api/') {
            self.processApiCall(parsed.query, response)
          } else {
            self.sendFile(filename, response)
          }
        }
    }

    this.log.info('[Config] launching configuration service')
    let keyFile = '/etc/config/server.pem'
    let certFile = '/etc/config/server.pem'
    if ((this.useTLS === true) && (fs.existsSync(keyFile)) && (fs.existsSync(certFile))) {
      // Just use Homematics TLS Certificate :o)
      const privateKey = fs.readFileSync(keyFile, 'utf8')
      const certificate = fs.readFileSync(certFile, 'utf8')
      const credentials = { key: privateKey, cert: certificate }
      try {
        this.server = https.createServer(credentials, serverHandler)
      } catch (e) {
        // fallback
        this.server = http.createServer(serverHandler)
      }
    } else {
      this.server = http.createServer(serverHandler)
    }

    this.sockjs_server = sockjs.createServer({
      sockjs_url: './assets/js/sockjs.min.js',
      log: function (message) {
        self.log.debug(message)
      }
    })

    this.sockjs_server.on('connection', function (conn) {
      conn.on('close', function () {
        self.log.debug('Socked Close Message for %s', conn.id)
        self.handleSocketRequest(conn, {
          command: 'close'
        })
      })

      conn.on('data', function (message) {
        try {
          self.handleSocketRequest(conn, JSON.parse(message))
        } catch (e) {

        }
      })
    })

    this.sockjs_server.installHandlers(this.server, {
      prefix: '/websockets'
    })

    this.server.listen(this.configServerPort, () => {
      self.log.info('[Config] running %s configuration server on port %s', (this.useTLS ? 'secure' : ''), self.configServerPort)
    })

    this.connections = {}
    self.log.info('Config Start heartBeat')
    this.heartBeat()
    self.log.info('Config Server is running')
  }

  sendMessageToSockets(message) {
    let self = this
    Object.keys(this.connections).map((connId) => {
      let conn = self.connections[connId]
      try {
        if (conn) {
          conn.write(JSON.stringify(message))
        }
      } catch (error) {
        if (conn) {
          try {
            conn.close()
          } catch (error) { }
        }
      }
    })
  }

  async handleSocketRequest(conn, message) {
    if (message.command === 'hello') {
      this.log.debug('[Config] add %s to sockets', conn.id)
      this.connections[conn.id] = conn
      // Send hello
      let sysData = await this.getSystemInfo()
      conn.write(JSON.stringify({ message: 'ackn', payload: sysData }))
    }

    if (message.command === 'close') {
      if (this.connections[conn.id] !== undefined) {
        this.log.debug('[Config] remove %s from sockets', conn.id)
        delete this.connections[conn.id]
      }
    }
  }

  fetchVersion() {
    let packageFile = path.join(__dirname, '..', '..', 'package.json')
    this.log.debug('[Config] Check Version from %s', packageFile)
    if (fs.existsSync(packageFile)) {
      try {
        this.packageData = JSON.parse(fs.readFileSync(packageFile))
        this.log.debug('[Config] version is %s', this.packageData.version)
        return this.packageData.version
      } catch (e) {
        return 'no version found'
      }
    }
    return 'no version found'
  }

  getSupportData(address) {
    // first get the device file
    let deviceFile = path.join(process.env.UIX_CONFIG_PATH, 'devices.json')
    if (fs.existsSync(deviceFile)) {
      try {
        let objDev = JSON.parse(fs.readFileSync(deviceFile))
        var result = {}
        if ((objDev) && (objDev.devices)) {
          objDev.devices.map(device => {
            var id = 1000
            // make it random
            var digits = Math.floor(Math.random() * 9000000000) + 1000000000
            var dummyAdr = digits.toString() + 'ABCD'
            if (device.address === address) {
              result.devices = []
              let tmpD = {
                id: id,
                intf: 0,
                intfName: '',
                name: device.type,
                address: dummyAdr,
                type: device.type,
                channels: []
              }
              id = id + 1
              device.channels.map(channel => {
                let chn = channel.address.split(':').slice(1, 2)[0]
                let tmpC = {
                  id: id,
                  name: dummyAdr + ':' + chn,
                  intf: 0,
                  address: dummyAdr + ':' + chn,
                  type: channel.type,
                  access: channel.access
                }
                tmpD.channels.push(tmpC)
                id = id + 1
              })
              result.devices.push(tmpD)
            }
          })
          return result
        }
      } catch (e) {
        return 'error while creating the file ' + e.stack
      }
    }
    return 'devices.json not found'
  }

  async getSystemInfo() {
    var result = {}
    result.cpu = os.cpus()
    result.mem = os.freemem()
    result.uptime = os.uptime()
    result.hapuptime = process.uptime()
    result.version = this.fetchVersion()
    result.update = result.version // set to the same version per default.
    // check  my version
    this.log.debug('[Config] Check Registry Version')
    let strRegData = ''
    try {
      strRegData = await this.getHTTP('https://registry.npmjs.org/hap-homematic', {})
      let oReg = JSON.parse(strRegData)
      if (oReg) {
        result.update = oReg['dist-tags'].latest
        this.log.debug('[Config] Found Registry Version %s', oReg['dist-tags'].latest)
      } else {
        this.log.debug('[Config] Unable to parse result %s', strRegData)
      }
    } catch (e) {
      this.log.debug('[Config] Unable to parse result %s', strRegData)
    }
    result.debug = this.log.isDebugEnabled()
    result.useAuth = this.useAuth
    result.useTLS = this.useTLS
    result.enableMonitoring = this.enableMonitoring
    result.disableHistory = this.disableHistory
    result.forceRefresh = this.forceRefresh
    result.forceCache = this.forceCache
    result.interfaceWatchdog = this.interfaceWatchdog
    this.forceRefresh = false
    return result
  }

  // make it fucking Node8 compatible
  getHTTP(urlStr, options) {
    return new Promise((resolve, reject) => {
      if (!options) {
        options = {}
      }
      var q = url.parse(urlStr, true)
      options.path = q.pathname
      options.host = q.hostname
      options.port = q.port

      https.get(options, (resp) => {
        let data = ''

        resp.on('data', (chunk) => {
          data += chunk
        })

        resp.on('end', () => {
          resolve(data)
        })
      }).on('error', (err) => {
        reject(err)
      })
    })
  }

  async updateSystem() {
    // first create a backup of users config
    let backupFile = await this.generateBackup()
    // move the backup to the config folder
    let version = this.fetchVersion()
    let autoBackupFile = path.join(process.env.UIX_CONFIG_PATH, 'hap-autobackup_' + version + '.tar.gz')
    try {
      if (fs.existsSync(backupFile)) {
        if (fs.existsSync(autoBackupFile)) {
          fs.unlinkSync(autoBackupFile)
        }
        fs.copyFileSync(backupFile, autoBackupFile)
      }
      // get the update command and run it
    } catch (e) {
      return { 'error': 'autobackup failed' }
    }
    let packageFile = path.join(__dirname, '..', '..', 'package.json')
    if (fs.existsSync(packageFile)) {
      try {
        let packageData = JSON.parse(fs.readFileSync(packageFile))
        if ((packageData) && (packageData.scripts)) {
          let updateScript = packageData.scripts.update
          let restartScript = packageData.scripts.restart
          if ((updateScript) && (restartScript)) {
            const childprocess = require('child_process')
            childprocess.execSync(updateScript)
            setTimeout(() => {
              childprocess.execSync(restartScript)
            }, 500)
          }
        }
      } catch (e) {
        let message = 'unable to get the update command ' + e.stack
        return { 'error': message }
      }
    }
  }

  restartSystem() {
    // get the update command and run it
    let packageFile = path.join(__dirname, '..', '..', 'package.json')
    if (fs.existsSync(packageFile)) {
      try {
        let packageData = JSON.parse(fs.readFileSync(packageFile))
        if ((packageData) && (packageData.scripts)) {
          let restartScript = packageData.scripts.restart
          this.log.debug('restart command will be %s called in 500ms', restartScript)
          if (restartScript) {
            const childprocess = require('child_process')
            setTimeout(() => {
              childprocess.execSync(restartScript)
            }, 500)
          }
        }
      } catch (e) {
        return { 'error': 'unable to get the restart command' }
      }
    }
  }

  deviceWithUUID(uuid) {
    var result
    this.pluginAccessories.map(device => {
      if (device.UUID === uuid) {
        result = device
      }
    })
    return result
  }

  specialDeviceWithUUID(uuid) {
    var result
    this.pluginSpecial.map(device => {
      if (device.UUID === uuid) {
        result = device
      }
    })
    return result
  }

  bridgeWithId(uuid) {
    var result
    this.bridges.map(bridge => {
      if (bridge.id === uuid) {
        result = bridge
      }
    })
    return result
  }

  variableWithName(varName) {
    var result
    this.allVariables.map(variable => {
      if ((variable.isCompatible === true) && (variable.name === varName)) {
        result = variable
      }
    })
    return result
  }

  programWithName(progName) {
    var result
    this.compatiblePrograms.map(program => {
      if (program.name === progName) {
        result = program
      }
    })
    return result
  }

  serviceSettingsFor(channelAddress) {
    var result = {}
    result.service = []
    let self = this
    if (this.compatibleDevices) {
      this.compatibleDevices.map(device => {
        if (device.channels) {
          device.channels.map(channel => {
            if (channel.address === channelAddress) {
              let s1 = self.services[channel.type]
              if (s1) {
                s1.map(item => {
                  // make sure we do not filter this device
                  if ((item.filterDevice) && (item.filterDevice.indexOf(device.type) === -1)) {
                    result.service.push(item)
                  }
                })
              }
              let s2 = self.services[device.type + ':' + channel.type]
              if (s2) {
                s2.map(item => {
                  result.service.push(item)
                })
              }
            }
          })
        }
      })
      if (this.pluginSpecial) {
        // also map the special devices
        this.pluginSpecial.map(spdevice => {
          let chadr = spdevice.serial + ':' + spdevice.channel
          if (chadr === channelAddress) {
            // find service
            self.services['SPECIAL'].map(item => {
              result.service.push(item)
            })
          }
        })
      }
    }
    return result
  }

  getVariableServiceList() {
    var result = []
    if ((this.services) && (this.services['VARIABLE'])) {
      this.services['VARIABLE'].map(item => {
        result.push(item)
      })
    }
    return result
  }

  loadSettings() {
    let configFile = path.join(process.env.UIX_CONFIG_PATH, 'config.json')
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile))
    }
    return undefined
  }

  saveSettings(configData) {
    let configFile = path.join(process.env.UIX_CONFIG_PATH, 'config.json')
    fs.writeFileSync(configFile, JSON.stringify(configData, ' ', 1))
  }

  loadGraph(graph) {
    var hostname = os.hostname()
    let result = []
    let key = graph.item
    let id = graph.id
    if (id) {
      let hdidParts = id.split(':')
      if (hdidParts.length > 1) {
        let config = this.loadSettings()
        let cachePath = config.cache

        if (cachePath !== undefined) {
          cachePath = path.join(cachePath, 'evehistory')
        } else {
          cachePath = process.env.UIX_CONFIG_PATH
        }

        let filename = hostname + '_' + hdidParts[0] + '_' + hdidParts[1] + '_persist.json'
        let filePath = path.join(cachePath, filename)
        if (fs.existsSync(filePath)) {
          try {
            let dta = JSON.parse(fs.readFileSync(filePath))
            if ((dta) && (dta.history)) {
              // filter only the last 24 hours

              var ts = Math.round(new Date().getTime() / 1000)
              var tsYesterday = ts - (24 * 3600)

              let filtered = dta.history.filter(item => item.time > tsYesterday)
              filtered.map((item) => {
                if (item[key]) {
                  result.push({ timestamp: item.time, value: item[key] })
                }
              })
            }
          } catch (e) {
            this.log.error('[Config] parsing error for graph data %s', e)
          }
        } else {
          this.log.debug('[Config] unable to load graph data from %s', filePath)
        }
      }
    }
    return result
  }

  checkGraphes() {
    this.graphes = []
    let self = this
    let config = this.loadSettings()
    if ((config) && (config.mappings)) {
      Object.keys(config.mappings).map((mapping) => {
        let hkDeviceMapping = config.mappings[mapping]
        if ((hkDeviceMapping.settings) && (hkDeviceMapping.settings.showGraph) && (hkDeviceMapping.settings.showGraph !== 'DONT_SHOW')) {
          self.graphes.push({ id: mapping, item: hkDeviceMapping.settings.showGraph, name: hkDeviceMapping.name })
        }
      })
    }

    // check if we have saved files
    this.graphes.map((graph) => {
      let id = graph.id
      let cachePath = config.cache

      if (cachePath !== undefined) {
        cachePath = path.join(cachePath, 'evehistory')
      } else {
        cachePath = process.env.UIX_CONFIG_PATH
      }

      var hostname = os.hostname()
      let hdidParts = id.split(':')
      if (hdidParts.length > 1) {
        let filename = hostname + '_' + hdidParts[0] + '_' + hdidParts[1] + '_persist.json'
        let filePath = path.join(cachePath, filename)
        self.log.debug('Check Historyfile %s', filePath)
        if (!fs.existsSync(filePath)) {
          self.log.warn('File not exists removing graph')
          self.graphes = self.graphes.filter(item => item.id !== id)
        }
      }
    })
  }

  async saveDevice(data) {
    let name = data.name
    let channel = data.address
    var isSpecial

    if (channel === 'new:special') {
      isSpecial = uuid.generate('special_' + name)
      channel = isSpecial + ':0'
    }

    let settings = (data.settings) ? JSON.parse(data.settings) : {}

    let instance = uuid.generate('0')

    if (settings.instanceIDs !== undefined) {
      this.log.debug('[Config] settings up instances')
      instance = []
      Object.keys(settings.instanceIDs).map((oKey) => {
        instance.push(settings.instanceIDs[oKey])
      })
    } else {
      // if not in settings ... so use the first we'vfound
      if (data['instanceIDs[0]']) {
        instance = data['instanceIDs[0]']
      }
    }

    let service = data.serviceClass

    if ((name) && (channel) && (service)) {
      var configData = this.loadSettings()
      // generate the containers if not here yet
      if (configData === undefined) {
        configData = {}
      }
      if (configData.mappings === undefined) {
        configData.mappings = {}
      }

      if (configData.channels === undefined) {
        configData.channels = []
      }

      // There is a Special Array so put this also in
      if (isSpecial !== undefined) {
        if (configData.special === undefined) {
          configData.special = []
        }
        configData.special.push(isSpecial)
      }

      // remove settings which are not part of the class settings
      let clazzFile = path.join(__dirname, '..', 'services', service + '.js')
      if (fs.existsSync(clazzFile)) {
        let oClazz = require(clazzFile)
        let oClazzSettings = await oClazz.configurationItems()
        Object.keys(settings).map((key) => {
          if (Object.keys(oClazzSettings).indexOf(key) === -1) {
            delete settings[key]
            this.log.debug('[Config] removed %s which is not part of %s settings.', key, service)
          }
        })
      } else {
        this.log.debug('[Config] clazzFile %s not found', clazzFile)
      }

      // Add the mapping
      configData.mappings[channel] = {
        name: name,
        Service: service,
        instance: instance,
        settings: settings
      }

      if (configData.channels.indexOf(channel) === -1) {
        // Add the Channel if not here .. otherwise just override the config
        configData.channels.push(channel)
      }
      // Save the stuff
      this.saveSettings(configData)
      return { 'result': 'saved' }
    } else {
      return { 'result': 'error saving' }
    }
  }

  createapplicancesWizzard(instanceID, listChannelz) {
    let self = this
    let configData = this.loadSettings()

    if (configData === undefined) {
      configData = {}
    }
    if (configData.mappings === undefined) {
      configData.mappings = {}
    }

    if (configData.channels === undefined) {
      configData.channels = []
    }

    if ((configData.instances) && (configData.instances[instanceID])) {
      configData.instances[instanceID].publishDevices = true
    }

    listChannelz.map(aChannel => {
      // get the default service
      let sList = self.services[aChannel.type]
      if (sList) {
        if (configData.channels.indexOf(aChannel.address) === -1) {
          configData.channels.push(aChannel.address)
        }
        let serviceClazz = sList[0].serviceClazz
        configData.mappings[aChannel.address] = {
          name: aChannel.name,
          Service: serviceClazz,
          instance: instanceID,
          settings: {}
        }
      }
    })
    this.saveSettings(configData)
    this.process.send({
      topic: 'reloadApplicances'
    })
    return { 'result': 'saved' }
  }

  savePublishingFlag(bridges) {
    let self = this
    var configData = this.loadSettings() || { instances: { '0': { 'name': 'default' } } }
    self.log.debug('[Config] savePublishingFlag old Data %s', JSON.stringify(configData))
    bridges.map(bridgeId => {
      self.log.debug('[Config] savePublishingFlag %s', bridgeId)
      let oBridge = configData.instances[bridgeId]
      oBridge.publishDevices = true
    })
    self.log.debug('[Config] savePublishingFlag new Data %s', JSON.stringify(configData))
    this.saveSettings(configData)
  }

  randomMac() {
    var mac = '12:34:56'

    for (var i = 0; i < 6; i++) {
      if (i % 2 === 0) mac += ':'
      mac += Math.floor(Math.random() * 16).toString(16)
    }

    return mac.toUpperCase()
  }

  generatePin() {
    let code = Math.floor(10000000 + Math.random() * 90000000) + ''
    code = code.split('')
    code.splice(3, 0, '-')
    code.splice(6, 0, '-')
    code = code.join('')
    return code
  }

  generateSetupID() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const bytes = crypto.randomBytes(4)
    let setupID = ''

    for (var i = 0; i < 4; i++) {
      var index = bytes.readUInt8(i) % 26
      setupID += chars.charAt(index)
    }

    return setupID
  }

  createMultipleInstances(payload) {
    let self = this
    try {
      this.log.debug('[Config] payload Data %s', payload)
      let data = JSON.parse(payload)
      // load all data
      var configData = this.loadSettings()
      if (configData === undefined) {
        configData = {}
      }
      if (configData.instances === undefined) {
        configData.instances = {}
      }
      this.log.debug('[Config] payload %s', data)
      Object.keys(data).map(roomId => {
        let bridgeData = data[roomId]
        if (bridgeData.create === true) {
          var isUnique = true
          let name = bridgeData.name
          let roomId = parseInt(bridgeData.roomID)
          // check unique name
          Object.keys(configData.instances).map(bridgeId => {
            let bridge = configData.instances[bridgeId]
            if (bridge.name === name) {
              isUnique = false
            }
          })
          if (isUnique === true) {
            let newUUID = uuid.generate(String(Math.random()))
            let mac = self.randomMac()
            let instData = { 'name': name, 'user': mac, 'pincode': self.generatePin(), 'roomId': roomId, 'setupID': self.generateSetupID() }
            self.log.debug('[Config] will create instance %s', JSON.stringify(instData))
            configData.instances[newUUID] = instData
          }
        }
      })
      this.saveSettings(configData)
      this.process.send({
        topic: 'reloadApplicances'
      })
      return ({ message: 'created', payload: configData.instances })
    } catch (e) {
      this.log.error(e)
      return { 'error': e }
    }
  }

  createInstance(query) {
    let self = this
    return new Promise((resolve, reject) => {
      let name = query.name
      let publish = query.publish
      let roomId = (query.roomId) ? parseInt(query.roomId) : undefined
      var configData = this.loadSettings()
      if (configData === undefined) {
        configData = {}
      }
      if (configData.instances === undefined) {
        configData.instances = {}
      }
      var isUnique = true
      Object.keys(configData.instances).map(bridgeId => {
        let bridge = configData.instances[bridgeId]
        if (bridge.name === name) {
          isUnique = false
        }
      })
      if (isUnique === true) {
        let newUUID = uuid.generate(String(Math.random()))
        let mac = self.randomMac()
        configData.instances[newUUID] = { 'name': name, 'user': mac, 'pincode': self.generatePin(), 'roomId': roomId, 'setupID': self.generateSetupID() }
        self.saveSettings(configData)
      } else {
        reject(new Error('name not unique'))
      }
      if ((publish === true) || (publish === 'true')) {
        self.process.send({
          topic: 'reloadApplicances'
        })
      }
      setTimeout(() => {
        resolve(self.bridges)
      }, 2000)
    })
  }

  removeInstance(uuid) {
    let bridge = this.bridgeWithId(uuid)
    if ((bridge !== undefined) && (bridge.id !== 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab')) {
      // first set all devices to the default bridge
      let config = this.loadSettings()
      if (config.mappings !== undefined) {
        Object.keys(config.mappings).map(deviceId => {
          let device = config.mappings[deviceId]
          if (device.instance === uuid) {
            device.instance = 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab'
          }
        })
      }
      delete config.instances[uuid]
      this.saveSettings(config)
      this.process.send({
        topic: 'reloadApplicances'
      })
    }
  }

  removeDeletedDevice(channelID) {
    let configData = this.loadSettings()
    this.log.debug('[Config] will remove deleted device with address %s', channelID)
    if ((configData) && (configData.channels)) {
      let index = configData.channels.indexOf(channelID)
      if (index > -1) {
        this.log.debug('[Config] channel data found .. remove')
        configData.channels.splice(index, 1)
      }
    }
    if ((configData) && (configData.mappings)) {
      this.log.debug('[Config] remove mapping configuration')
      delete configData.mappings[channelID]
    }
    this.saveSettings(configData)
    // send the main system a message to remove the persistent data
    this.process.send({
      topic: 'remove',
      uuid: null
    })
    return { 'result': 'deleted' }
  }

  removeDevice(uuid) {
    let device = this.deviceWithUUID(uuid)
    if (!device) {
      this.log.debug('[Config] check special device for removal')
      device = this.specialDeviceWithUUID(uuid) // check if its a special device
    }
    if (device) {
      // remove the channel and the settings
      let configData = this.loadSettings()
      let address = device.serial + ':' + device.channel
      this.log.debug('[Config] will remove device with address %s', address)
      if ((configData) && (configData.channels)) {
        let index = configData.channels.indexOf(address)
        if (index > -1) {
          this.log.debug('[Config] channel data found .. remove')
          configData.channels.splice(index, 1)
        }
      }
      if ((configData) && (configData.mappings)) {
        this.log.debug('[Config] remove mapping configuration')
        delete configData.mappings[address]
      }

      // remove it from special if its there
      if ((configData) && (configData.special)) {
        let index = configData.special.indexOf(device.serial)
        if (index > -1) {
          this.log.debug('[Config] special entry found ... remove')
          configData.special.splice(index, 1)
        }
      }

      this.saveSettings(configData)
      // send the main system a message to remove the persistent data
      this.process.send({
        topic: 'remove',
        uuid: uuid
      })
      return { 'result': 'deleted' }
    } else {
      return { 'result': 'not found' }
    }
  }

  editInstance(query) {
    this.log.debug('[Config] edit Instance')
    let uuid = query.uuid
    let name = query.displayName
    let roomId = query.roomId
    this.log.debug('[Config] updating %s with %s', uuid, name)
    let bridge = this.bridgeWithId(uuid)
    this.log.debug('[Config] bridge %s', (bridge !== undefined))
    if ((bridge) && (name)) {
      // change the name in the config and reload everything
      let config = this.loadSettings()
      if ((config) && (config.instances)) {
        let instance = config.instances[uuid]
        instance.name = name
        if (roomId) {
          instance.roomId = parseInt(roomId)
        }
        this.saveSettings(config)
        this.process.send({
          topic: 'reloadApplicances',
          uuid: uuid
        })
        return { 'result': 'saved' }
      }
    }
    return { 'result': 'error name not filled or bridge not found' }
  }

  deactivateInstance(query) {
    this.log.debug('[Config] deactivating Instance')
    let uuid = query.uuid
    let bridge = this.bridgeWithId(uuid)
    this.log.debug('[Config] bridge %s', (bridge !== undefined))
    if (bridge) {
      // change the name in the config and reload everything
      let config = this.loadSettings()
      if ((config) && (config.instances)) {
        let instance = config.instances[uuid]
        delete instance.publishDevices
        this.saveSettings(config)
        this.process.send({
          topic: 'reloadApplicances',
          uuid: uuid
        })
        return { 'result': 'saved' }
      }
    }
    return { 'result': 'bridge not found' }
  }

  resetInstance(query) {
    this.log.debug('[Config] resetting Instance')
    let uuid = query.uuid
    let bridge = this.bridgeWithId(uuid)
    this.log.debug('[Config] bridge %s', (bridge !== undefined))
    if (bridge) {
      // we have to remove - $config/persist/AccessoryInfo.$mac.json and IdentifierCache.$mac.json
      let mac = bridge.user.replace(':', '')
      let ainfoFile = path.join(process.env.UIX_CONFIG_PATH, 'persist', 'AccessoryInfo' + mac + '.json')
      if (fs.existsSync(ainfoFile)) {
        fs.unlinkSync(ainfoFile)
      }
      let aICacheFile = path.join(process.env.UIX_CONFIG_PATH, 'persist', 'IdentifierCache' + mac + '.json')
      if (fs.existsSync(aICacheFile)) {
        fs.unlinkSync(aICacheFile)
      }
      // then reboot the instances
      this.process.send({
        topic: 'reloadApplicances',
        uuid: uuid
      })
    }
  }

  saveObject(query, objectType) {
    this.log.debug('[Config] save %s', objectType)
    let serial = query.serial
    let newName = query.name || serial
    let instance = query.instanceID
    var settings = {}
    if (query.settings) {
      try {
        settings = JSON.parse(query.settings)
      } catch (e) {

      }
    }
    let serviceClass = query.serviceClass
    let bridge = this.bridgeWithId(instance)
    if ((serial) && (newName) && (bridge)) {
      let config = this.loadSettings()
      // add or save variable
      if (!config[objectType]) {
        config[objectType] = []
      }
      if (config[objectType].indexOf(serial) === -1) {
        config[objectType].push(serial)
      }
      if (config.mappings === undefined) {
        config.mappings = {}
      }

      // remove settings which are not part of the class settings
      let clazzFile = path.join(__dirname, '..', 'services', serviceClass + '.js')
      if (fs.existsSync(clazzFile)) {
        let oClazz = require(clazzFile)
        let oClazzSettings = oClazz.configurationItems()
        Object.keys(settings).map((key) => {
          if (Object.keys(oClazzSettings).indexOf(key) === -1) {
            delete settings[key]
            this.log.debug('[Config] removed %s which is not part of %s settings.', key, serviceClass)
          }
        })
      } else {
        this.log.debug('[Config] clazzFile %s not found', clazzFile)
      }
      // add mapping data
      config.mappings[serial + ':0'] = {
        name: newName,
        instance: instance,
        Service: serviceClass,
        settings: settings
      }
      this.saveSettings(config)
      this.process.send({
        topic: 'reloadApplicances',
        uuid: uuid
      })
      return { 'result': 'saved' }
    } else {
      return { 'result': 'error name or serial or instance not found' }
    }
  }

  removeObject(serial, uuid, objectType) {
    if (serial) {
      this.log.debug('[Config] try to remove %s %s', objectType, serial)
      // remove the channel and the settings
      let configData = this.loadSettings()

      if ((configData) && (configData[objectType])) {
        let index = configData[objectType].indexOf(serial)
        if (index > -1) {
          configData[objectType].splice(index, 1)
        }
      }
      if ((configData) && (configData.mappings)) {
        delete configData.mappings[serial + ':0']
      }

      this.saveSettings(configData)
      // send the main system a message to remove the persistent data
      this.process.send({
        topic: 'remove',
        uuid: uuid
      })
      return { 'result': 'deleted' }
    } else {
      return { 'result': 'not found' }
    }
  }

  saveVariableTrigger(datapoint, autoUpdateVarTriggerHelper) {
    if (datapoint) {
      let configData = this.loadSettings()
      configData.VariableUpdateEvent = datapoint
      configData.autoUpdateVarTriggerHelper = ((autoUpdateVarTriggerHelper === true) || (autoUpdateVarTriggerHelper === 'true'))
      this.saveSettings(configData)
      this.process.send({
        topic: 'reloadApplicances',
        uuid: uuid
      })
      return { 'result': 'saved' }
    } else {
      return { 'result': 'missing argument' }
    }
  }

  getRoombyId(roomID) {
    return this.pluginRooms.filter(room => room.id === roomID)[0] || undefined
  }

  generateRoomListWithSupportedDevices() {
    let result = []
    if (this.pluginRooms) {
      this.pluginRooms.map(room => {
        let oRoom = { id: room.id, name: room.name, devices: [] }
        let cList = room.channels
        this.compatibleDevices.map(device => {
          var dCList = []
          device.channels.map(channel => {
            if ((cList.indexOf(channel.id) > -1) && (channel.isSuported === true)) {
              dCList.push(channel)
            }
          })
          if (dCList.length > 0) {
            let oDevice = { id: device.id, name: device.name, type: device.type, channels: dCList }
            oRoom.devices.push(oDevice)
          }
        })
        result.push(oRoom)
      })
    }
    return result
  }

  saveGlobalSettings(query) {
    if (query.settings) {
      let oSettings = JSON.parse(query.settings)
      let config = this.loadSettings()

      if (config === undefined) {
        config = {}
      }
      config.useCCCAuthentication = ((oSettings.useAuth === true) || (oSettings.useAuth === 'true'))
      config.useTLS = ((oSettings.useTLS === true) || (oSettings.useTLS === 'true'))
      config.enableMonitoring = ((oSettings.enableMonitoring === true) || (oSettings.enableMonitoring === 'true'))
      config.disableHistory = ((oSettings.disableHistory === true) || (oSettings.disableHistory === 'true'))
      // make sure we have the value set
      if (oSettings.interfaceWatchdog) {
        if ((oSettings.interfaceWatchdog > 0) && (oSettings.interfaceWatchdog < 300)) {
          oSettings.interfaceWatchdog = 300 // min is 300seconds
        }
        config.interfaceWatchdog = oSettings.interfaceWatchdog
      }
      this.saveSettings(config)
    }
  }

  ccuPost(port, path, body) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length
        }
      }

      const req = http.request(options, (res) => {
        var data = ''
        res.on('data', (d) => {
          data = data + d
        })

        res.on('end', () => {
          resolve(data)
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.write(body)
      req.end()
    })
  }

  existsDevice(channelAdr) {
    return this.compatibleDevices.filter(device => {
      return (channelAdr.indexOf(device.address) > -1)
    }).length > 0
  }

  checkDevicesStillExists() {
    // load the channels from config
    this.log.debug('Check Lost and found')
    let config = this.loadSettings()
    let lostChannels = []
    let result = []
    let self = this

    if ((config !== undefined) && (config.channels !== undefined)) {
      // match the list
      config.channels.forEach((channelAdr) => {
        self.log.debug('probing channel %s', channelAdr)
        if (!self.existsDevice(channelAdr)) {
          if (!channelAdr.endsWith(':0')) { // uuid:0 are special channels so we will skip them
            self.log.debug('%s was removed from the ccu', channelAdr)
            lostChannels.push(channelAdr)
          }
        } else {
          self.log.debug('%s still exists', channelAdr)
        }
      })
    }

    lostChannels.forEach(channelAdr => {
      let dta = config.mappings[channelAdr]
      dta.address = channelAdr
      result.push(dta)
    })
    return result
  }

  async ccuGetDatapoints(channelID) {
    let script = "Write('{\"datapoints\":[');string sid;boolean dpf = true;var x = dom.GetObject("
    script += channelID
    script += ");if (x) {foreach(sid, x.DPs().EnumUsedIDs()) {if (dpf) {dpf=false;} else {Write(',');}Write('\"');Write(dom.GetObject(sid).Name());Write('\"');}}Write(']}');"
    let result = await this.ccuPost(8181, '/tclrega.exe', script)
    try {
      const pos = result.lastIndexOf('<xml><exec>')
      const response = (result.substring(0, pos))
      return JSON.parse(response)
    } catch (e) {
      return {}
    }
  }

  async ccuCGICall(sid, method, parameters) {
    let lParameters = { '_session_id_': sid }
    if (parameters) {
      Object.keys(parameters).map((key) => {
        lParameters[key] = parameters[key]
      })
    }
    let body = { 'version': '1.1', 'method': method, 'params': lParameters }
    let result = await this.ccuPost(80, '/api/homematic.cgi', JSON.stringify(body))
    try {
      return JSON.parse(result)
    } catch (e) {
      return {}
    }
  }

  async renewCCUSession(sid) {
    await this.ccuCGICall(sid, 'Session.renew')
  }

  isValidCCUSession(sid) {
    let self = this
    return new Promise((resolve, reject) => {
      // first remove the @ char
      let regex = /@([0-9a-zA-Z]{10})@/g
      let prts = regex.exec(sid)
      if ((prts) && (prts.length > 1)) {
        let script = 'Write(system.GetSessionVarStr(\'' + prts[1] + '\'));'
        let rega = new Rega(self.log, '127.0.0.1')
        rega.script(script).then(regaResult => {
          let rgx = /^([0-9]*);([0-9])*;([^;]*);([^;]*);([^;]*);$/
          let usrPrts = rgx.exec(regaResult)
          self.log.debug('[Config] check auth %s', usrPrts)
          if ((usrPrts) && (usrPrts.length > 2)) {
            self.renewCCUSession(prts[1]) // renew the session in ccu
            resolve(parseInt(usrPrts[2]) >= 8)
          } else {
            resolve(false)
          }
        })
      } else {
        resolve(false)
      }
    })
  }

  async getCCUFirewallConfiguration() {
    // get the /etc/config/firewall.conf
    let config = {}
    let fireWallConfig = path.join('/', 'etc', 'config', 'firewall.conf')
    if (fs.existsSync(fireWallConfig)) {
      let dta = fs.readFileSync(fireWallConfig)
      if (dta) {
        let rgxMode = /MODE.=.([a-zA-Z_]{1,})/
        let rgxModeParts = rgxMode.exec(dta)
        if ((rgxModeParts) && (rgxModeParts.length > 1)) {
          config.mode = rgxModeParts[1]
        }
        let rgxPorts = /USERPORTS.=.([0-9 ]{1,})/
        let rgxPortsParts = rgxPorts.exec(dta)
        if ((rgxPortsParts) && (rgxPortsParts.length > 1)) {
          config.userports = rgxPortsParts[1].split(' ')
        }
      } else {
        this.log.error('[Config] firewallConfig not readable')
      }
    } else {
      this.log.error('[Config] unable to find firewall config %s', fireWallConfig)
    }
    return config
  }

  fetchUpdateChangelog() {
    return new Promise(async (resolve, reject) => {
      let version = this.fetchVersion()
      let rgx = RegExp('([a-zA-Z 0-9.:\n=*-]{1,})(?=Changelog for ' + version + ')')
      let strChangeLog = await this.getHTTP('https://raw.githubusercontent.com/thkl/hap-homematic/master/CHANGELOG.md', { headers: { 'Cache-Control': 'no-cache' } })
      let rst = rgx.exec(strChangeLog)
      resolve(((rst) && (rst.length > 0)) ? rst[0] : 'No remote changelog found')
    })
  }

  generateBackup() {
    let self = this
    return new Promise((resolve, reject) => {
      this.log.info('[Config] creating backup')
      let backupFile = '/tmp/hap_homematic_backup.tar.gz'
      // remove the old backup if there is one
      if (fs.existsSync(backupFile)) {
        this.log.warn('[Config] old backup found. will remove this')
        fs.unlinkSync(backupFile)
      }
      let backupCommand = 'tar -C ' + process.env.UIX_CONFIG_PATH + ' -czvf ' + backupFile + ' --exclude="*persist.json" --exclude="hap-autobackup_*.*" .'
      this.log.info('[Config] running %s', backupCommand)
      const childprocess = require('child_process')
      childprocess.exec(backupCommand, (error, stdout, stderr) => {
        self.log.info('[Config] creating backup done will return %s', stdout)
        if (error) {
          reject(error)
        }
        resolve(backupFile)
      })
    })
  }

  checkAndExtractUploadedConfig(tmpFile) {
    // create a tmp directory and extract the file
    let tmpDir = path.join('/', 'tmp', 'haptmp')
    if (fs.existsSync(tmpDir)) {
      // clean up by removing old stuff
      this.deleteFolderRecursive(tmpDir)
    }
    fs.mkdirSync(tmpDir)
    // extract the files there
    const childprocess = require('child_process')
    try {
      childprocess.execSync('tar -xzf ' + tmpFile + ' -C ' + tmpDir)
    } catch (e) {
      this.log.error('[Config] error while extracting the upload')
      return false
    }

    // check config.json
    try {
      let tmpConfig = JSON.parse(fs.readFileSync(path.join(tmpDir, 'config.json')))
      if (tmpConfig) {
        // move the config to my folder
        let myConfigFile = path.join(process.env.UIX_CONFIG_PATH, 'config.json')
        if (fs.existsSync(myConfigFile)) {
          fs.unlinkSync(myConfigFile)
        }
        fs.copyFileSync(path.join(tmpDir, 'config.json'), path.join(process.env.UIX_CONFIG_PATH, 'config.json'))
        // copy the persistent files
        let rgx1 = new RegExp(os.hostname + '_.*.pstore')
        let rgx2 = new RegExp(os.hostname + '_.*_persist.json')
        fs.readdir(tmpDir, (err, files) => {
          if (!err) {
            files.forEach(file => {
              if ((file.match(rgx1)) || (file.match(rgx2))) {
                fs.copyFileSync(path.join(tmpDir, file), path.join(process.env.UIX_CONFIG_PATH, file))
              }
            })
          }
        })
        // create the new persist folder
        let persistFolder = path.join(process.env.UIX_CONFIG_PATH, 'persist')

        if (!fs.existsSync(persistFolder)) {
          fs.mkdirSync(persistFolder)
          // copy all persist data to the config path
          fs.readdir(path.join(tmpDir, 'persist'), (err, files) => {
            if (!err) {
              files.forEach(file => {
                fs.copyFileSync(path.join(tmpDir, 'persist', file), path.join(persistFolder, file))
              })
            }
          })
        }
        // remove the uploaded file
        fs.unlinkSync(tmpFile)
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  }

  async heartBeat() {
    let self = this
    if (Object.keys(this.connections).length > 0) {
      let sysData = await this.getSystemInfo()
      this.sendMessageToSockets({ message: 'heartbeat', payload: sysData })
    }
    setTimeout(() => {
      self.heartBeat()
    }, 180 * 1000)
  }

  extractSid(sid) {
    let regex = /@([0-9a-zA-Z]{10})@/g
    let prts = regex.exec(sid)
    if ((prts) && (prts.length > 1)) {
      return prts[1]
    } else {
      return undefined
    }
  }

  deleteFolderRecursive(pathRemove) {
    let self = this
    if (fs.existsSync(pathRemove)) {
      fs.readdirSync(pathRemove).forEach((file, index) => {
        const curPath = path.join(pathRemove, file)
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          self.deleteFolderRecursive(curPath)
        } else { // delete file
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(pathRemove)
    }
  }

  processRestore(request, response) {
    const formidable = require('formidable')
    const form = formidable({ multiples: false })
    let self = this
    form.parse(request, (err, fields, files) => {
      if (!err) {
        if ((fields) && (fields['method'] === 'restore')) { // Check  method
          if (self.checkSid(fields['sid'], response)) { // check session
            if ((files.file) && (files.file.path)) {
              if (self.checkAndExtractUploadedConfig(files.file.path)) {
                self.restartSystem()
              }
            }
          }
        }
      }
      response.writeHead(200, 'OK')
      response.end('OK')
    })
  }

  async checkSid(sid, response) {
    if (this.useAuth === true) {
      // check if the provide sid is valid and the user has level 8
      let validuser = await this.isValidCCUSession(sid)
      if (validuser === false) {
        this.log.error('[Config] invalid user')
        response.writeHead(401, 'Unauthorized')
        response.end('Unauthorized')
        return false
      }
    }
    return true
  }

  async processApiCall(query, response) {
    // if we are using ccu's authentication system
    let isValidUserSession = await this.checkSid(query.sid, response)
    if (isValidUserSession === false) {
      return
    }
    if (query.method) {
      let sid = this.extractSid(query.sid)
      var readStream
      switch (query.method) {
        case 'ccuGetDatapoints':
          let dps = await this.ccuGetDatapoints(query.cid)
          this.sendJSON(dps, response)
          break

        case 'refresh':
          this.sendObjects(sid)
          this.sendJSON({ result: 'ok' }, response)
          break

        case 'refreshCache':
          this.process.send({
            topic: 'refreshCache'
          })

          this.sendJSON({ result: 'initiated' }, response)
          break

        /** returns all known devices */
        case 'devicelist':
          this.sendJSON(this.pluginAccessories, response)
          break
        /** returns all known variables */
        case 'variablelist':
          let srvList = this.getVariableServiceList()
          this.sendJSON({ variables: this.pluginVariables, trigger: this.pluginVariableTrigger, services: srvList }, response)
          break

        /** returns all known programs */
        case 'programlist':
          this.sendJSON({ programs: this.pluginPrograms }, response)
          break

        case 'speciallist':
          this.sendJSON({ special: this.pluginSpecial }, response)
          break

        /** returns all known rooms */
        case 'roomlist':
          this.sendJSON({ rooms: this.pluginRooms }, response)
          break

        /** returns all hap instances */
        case 'bridges':
          if (sid) {
            this.getCCUFirewallConfiguration(sid)
          }
          this.sendJSON(this.bridges, response)
          break
        /** returns system informations */
        case 'system':
          let sysData = await this.getSystemInfo()
          this.sendJSON(sysData, response)
          break

        /** publish the hap instances to homekit */
        case 'publish':
          // Save PublishDevices Infos
          let bridgesToPublish = query.bridges
          if (bridgesToPublish) {
            this.log.debug('[Config] setPublish flag for %s', bridgesToPublish)
            this.savePublishingFlag(JSON.parse(bridgesToPublish))
          }

          this.process.send({
            topic: 'reloadApplicances'
          })

          this.sendJSON({ result: 'initiated' }, response)
          break

        /** send the list of compatible ccu devices back to the js application */
        case 'newDevice':
          // send a list with compatible devices
          var list = []
          this.compatibleDevices.map(device => {
            var lCha = []
            var oDev = { device: device.address, name: device.name, type: device.type }
            device.channels.map(channel => {
              if (channel.isSuported === true) {
                lCha.push({ id: channel.id, address: channel.address, name: channel.name, type: channel.type })
              }
            })
            oDev.channels = lCha
            list.push(oDev)
          })
          this.sendJSON({ devices: list }, response)
          break
        case 'createapplicanceswizzard':
          this.sendJSON(this.createapplicancesWizzard(query.instanceId, JSON.parse(query.payload)), response)
          break
        case 'newVariable':
          let varlist = this.allVariables.filter(variable => variable.isCompatible === true)
          this.sendJSON({ variables: varlist }, response)
          break

        case 'allVariables':
          this.sendJSON({ variables: this.allVariables }, response)
          break

        case 'newProgram':
          this.sendJSON({ programs: this.compatiblePrograms }, response)
          break

        case 'virtualKeys':
          this.sendJSON({ virtualKeys: this.virtualKeys }, response)
          break

        /** returns the list of known services */
        case 'service':
          if (query.channelAddress === 'new:special') {
            let result = {}
            result.service = []
            this.services['SPECIAL'].map(item => {
              result.service.push(item)
            })
            this.sendJSON(result, response)
          } else {
            this.sendJSON(this.serviceSettingsFor(query.channelAddress), response)
          }
          break

        /** save a new device */
        case 'saveNewDevice':
          this.sendJSON(this.saveDevice(query), response)
          break

        case 'saveDevice':
          this.sendJSON(this.saveDevice(query), response)
          break
        /** remove a device */
        case 'removeDevice':
          this.sendJSON(this.removeDevice(query.uuid), response)
          break

        case 'removeDeletedDevice':
          this.sendJSON(this.removeDeletedDevice(query.address), response)
          break

        case 'removeVariable':
          this.sendJSON(this.removeObject(query.serial, query.uuid, 'variables'), response)
          break

        case 'removeProgram':
          this.sendJSON(this.removeObject(query.serial, query.uuid, 'programs'), response)
          break

        /** creates a new hap instance */
        case 'createinstance':
          let newBridgeList = await this.createInstance(query)
          this.sendJSON(newBridgeList, response)
          break

        case 'createinstancewizzard':
          let payload = query.playload
          this.log.debug('[Config] creating instances from wizzard %s', payload)
          let newBridgeListW = await this.createMultipleInstances(payload)
          this.sendJSON(newBridgeListW, response)
          break

        /** edit the name of an instance */
        case 'editinstance':
          this.sendJSON(this.editInstance(query), response)
          break

        case 'deactivateInstance':
          this.sendJSON(this.deactivateInstance(query), response)
          break

        case 'removehapinstance':
          this.sendJSON(this.removeInstance(query.id), response)
          break

        case 'saveVariable':
          if (this.variableWithName(query.serial)) {
            this.sendJSON(this.saveObject(query, 'variables'), response)
          } else {
            this.sendJSON({ error: 'unknown variable' }, response)
          }
          this.sendObjects()
          break

        case 'saveProgram':
          if (this.programWithName(query.serial)) {
            this.sendJSON(this.saveObject(query, 'programs'), response)
          } else {
            this.sendJSON({ error: 'unknown program' }, response)
          }
          this.sendObjects()
          break

        case 'saveVariableTrigger':
          this.sendJSON(this.saveVariableTrigger(query.datapoint, query.autoUpdateVarTriggerHelper), response)
          this.sendObjects()
          let configData = this.loadSettings()
          if (configData.autoUpdateVarTriggerHelper === true) {
            // Update the Trigger Program
            this.process.send({
              topic: 'createTrigger'
            })
          }
          break

        case 'wizzardRooms':
          this.sendJSON(this.generateRoomListWithSupportedDevices(), response)
          break

        case 'update':
          this.sendJSON(this.updateSystem(), response)
          break

        case 'restart':
          // check if we should turn debug mode on
          if (query.debug === 'true') {
            // create a indicator in /tmp named .hapdebug
            let fdebug = path.join(fs.realpathSync(os.tmpdir()), '.hapdebug')
            fs.closeSync(fs.openSync(fdebug, 'w'))
          }
          this.sendJSON({ 'response': 'ok' }, response)
          this.log.info('performing restart')
          this.restartSystem()
          break

        case 'debug':
          this.process.send(
            {
              topic: 'debug',
              debug: (query.enable === 'true')
            }
          )
          this.sendJSON({ 'response': 'ok' }, response)
          this.heartBeat() // trigger a new websocks push so the UI will change
          break

        case 'saveSettings':
          this.saveGlobalSettings(query)
          this.sendJSON({ 'response': 'ok' }, response)
          this.restartSystem()
          break

        case 'getLog':

          var stat = fs.statSync(this.logfile)

          response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=hap-homematic-log.txt',
            'Content-Length': stat.size
          })

          readStream = fs.createReadStream(this.logfile)
          readStream.pipe(response)
          break

        case 'backup':
          this.log.info('[Config] backup Command')
          let backupFile = await this.generateBackup()
          if (fs.existsSync(backupFile)) {
            let statBf = fs.statSync(backupFile)
            let d = new Date();
            response.writeHead(200, {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `attachment; filename=hap-homematic-backup-${d.getDate()}_${d.getMonth() + 1}_${d.getFullYear()}_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.tar.gz`,
              'Content-Length': statBf.size
            })

            readStream = fs.createReadStream(backupFile)
            readStream.pipe(response)
          } else {
            this.sendJSON({ error: 'backup file not found', path: backupFile }, response)
          }
          break

        case 'changelog':
          let cFile = path.join(__dirname, '..', '..', 'CHANGELOG.md')
          if (fs.existsSync(cFile)) {
            let stat = fs.statSync(cFile)
            response.writeHead(200, {
              'Content-Type': 'text/markdown',
              'Content-Length': stat.size
            })
            readStream = fs.createReadStream(cFile)
            readStream.pipe(response)
          } else {
            this.sendJSON({ error: 'changelog not found', path: cFile }, response)
          }
          break

        case 'updateChangelog':
          response.writeHead(200, {
            'Content-Type': 'text/markdown'
          })
          let msg = await (this.fetchUpdateChangelog())
          response.end(msg)
          break

        case 'support':
          let sData = this.getSupportData(query.address)
          var fileName = '_device.json'
          if ((sData) && (sData.devices)) {
            fileName = sData.devices[0].type + '.json'
          }
          response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=' + fileName
          })

          response.end(JSON.stringify(sData, ' ', 2))
          break

        case 'listGraph':
          this.checkGraphes()
          response.end(JSON.stringify(this.graphes, ' ', 2))

          break

        case 'resetInstance':
          this.resetInstance(query)
          break

        case 'graphDetail':
          this.checkGraphes()
          let graphId = query.id
          this.log.debug('[Config] searching graph id %s', graphId)
          let selectedGraph = this.graphes.filter(graph => graph.id === graphId)
          if (selectedGraph) {
            let data = await this.loadGraph(selectedGraph[0])
            response.end(JSON.stringify(data))
          } else {
            response.end(JSON.stringify([

            ]))
          }

          break
        case 'checklost':
          let result = this.checkDevicesStillExists()
          response.end(JSON.stringify(result))
          break
        /** fallback */
        default:
          this.sendJSON({ error: 'unknown method' }, response)
          break
      }
    } else {
      this.sendJSON({ error: 'missing arguments' }, response)
    }
  }

  async sendObjects() {
    this.log.debug('sendObjects fetching firewall data')
    // check the current firewall settings match the used ports
    let data = await this.getCCUFirewallConfiguration()
    let fwConfig = data
    if (fwConfig) {
      this.log.debug('fw Config found %s', fwConfig)
      this.bridges.map((bridge) => {
        if ((fwConfig.mode) && (fwConfig.mode === 'MOST_OPEN')) {
          bridge.ccuFirewall = true
        } else
          if ((fwConfig.mode) && (fwConfig.mode === 'RESTRICTIVE') && (fwConfig.userports) && (fwConfig.userports.indexOf(String(bridge.port)) > -1)) {
            bridge.ccuFirewall = true
          } else {
            bridge.ccuFirewall = false
          }
      })
    }
    const socketPayload = {
      accessories: this.pluginAccessories,
      variables: this.pluginVariables,
      variableTrigger: this.pluginVariableTrigger,
      autoUpdateVarTriggerHelper: this.autoUpdateVarTriggerHelper,
      variableServices: this.getVariableServiceList(),
      programs: this.pluginPrograms,
      rooms: this.pluginRooms,
      special: this.pluginSpecial,
      bridges: this.bridges,
      ccuDevices: this.compatibleDevices
    }

    this.log.debug('send Socket Message %s', JSON.stringify(socketPayload));
    this.sendMessageToSockets({
      message: 'serverdata',
      payload: socketPayload
    })

  }

  handleIncommingIPCMessage(message) {
    if (message.topic) {
      switch (message.topic) {
        case 'serverdata':
          this.log.debug('Incomming IPC Serverdata: %s', JSON.stringify(message))
          if (message.accessories) {
            this.pluginAccessories = message.accessories
          }
          if (message.variables) {
            this.pluginVariables = message.variables
          }
          if (message.variableTrigger) {
            this.pluginVariableTrigger = message.variableTrigger
          }
          if (message.autoUpdateVarTriggerHelper) {
            this.autoUpdateVarTriggerHelper = message.autoUpdateVarTriggerHelper
          }
          if (message.programs) {
            this.pluginPrograms = message.programs
          }
          if (message.rooms) {
            this.pluginRooms = message.rooms
          }

          if (message.special) {
            this.pluginSpecial = message.special
          }

          if (message.logfile) {
            this.logfile = message.logfile
          }
          this.sendObjects()
          break

        case 'virtualKeys':
          this.virtualKeys = message.virtualKeys
          break

        case 'bridges':
          this.bridges = message.bridges
          break
        case 'services':
          logger.debug('Services :%s', JSON.stringify(message.services))
          this.services = message.services
          break

        case 'compatibleObjects':
          this.compatibleDevices = message.devices
          this.allVariables = message.variables
          this.compatiblePrograms = message.programs
          break

        case 'shutdown':
          console.log('Shutdown ConfigService')
          this.process.exit()
          break

        case 'debug':
          this.log.setDebugEnabled(message.debug)
          break
      }
    }
  }
}

let logger = new Logger('HAP ConfigServer')
logger.setDebugEnabled(process.env.UIX_DEBUG)
let pcs = new ConfigurationService(logger)
pcs.run()
pcs.process = process

logger.info('[Config] server is up and running messaging daemon about that')
process.send({
  topic: 'cfghello'
})

setInterval(() => {
  if (!process.connected) {
    console('[Config] Shutdown Configuration Service')
    pcs.shutdown()
    process.exit()
  }
}, 10000)

process.on('message', (message) => {
  pcs.handleIncommingIPCMessage(message)
})

process.on('disconnect', () => {
  logger.info('[Config] Shutdown Configuration Service')
  pcs.shutdown()
  process.exit()
})
