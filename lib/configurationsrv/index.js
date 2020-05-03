const path = require('path')
const fs = require('fs')
const http = require('http')
const https = require('https')
const url = require('url')
const qs = require('querystring')
const uuid = require('hap-nodejs').uuid
const Logger = require(path.join(__dirname, '..', 'logger.js'))
const Rega = require(path.join(__dirname, '..', 'HomeMaticRegaRequest.js'))
const os = require('os')

process.title = 'hap-homematic-config'

class ConfigurationService {
  constructor (logger) {
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
    this.compatibleVariables = []
    this.compatibleDevices = []

    let config = this.loadSettings()
    this.useAuth = config.useCCCAuthentication || false
    this.useTLS = config.useTLS || false
  }

  shutdown () {
    this.server.close()
    this.log.close()
  }

  sendFile (unsafeSuffix, response) {
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

  sendJSON (object, response) {
    response.writeHead(200, {
      'Content-Type': 'application/json'
    })
    response.end(JSON.stringify(object))
  }

  async run () {
    let self = this

    function serverHandler (request, response) {
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
      const credentials = {key: privateKey, cert: certificate}
      try {
        this.server = https.createServer(credentials, serverHandler)
      } catch (e) {
        // fallback
        this.server = http.createServer(serverHandler)
      }
    } else {
      this.server = http.createServer(serverHandler)
    }
    this.server.listen(this.configServerPort, () => {
      self.log.info('[Config] running %s configuration server on port %s', (this.useTLS ? 'secure' : ''), self.configServerPort)
    })
  }

  fetchVersion () {
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

  getSupportData (address) {
    // first get the device file
    let deviceFile = path.join(process.env.UIX_CONFIG_PATH, 'devices.json')
    if (fs.existsSync(deviceFile)) {
      try {
        let objDev = JSON.parse(fs.readFileSync(deviceFile))
        var result = {}
        if ((objDev) && (objDev.devices)) {
          objDev.devices.map(device => {
            var id = 1000
            var dummyAdr = '0123456789ABCD'
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

  async getSystemInfo () {
    var result = {}
    result.cpu = os.cpus()
    result.mem = os.freemem()
    result.uptime = os.uptime()
    result.hapuptime = process.uptime()
    result.version = this.fetchVersion()
    // check  my version
    this.log.debug('[Config] Check Registry Version')
    let strRegData = await this.getHTTP('https://registry.npmjs.org/hap-homematic', {})
    try {
      let oReg = JSON.parse(strRegData)
      if (oReg) {
        result.update = oReg['dist-tags'].latest
        this.log.debug('[Config] Found Registry Version %s', oReg['dist-tags'].latest)
      } else {
        this.log.debug('[Config] Unable to parse result %s', strRegData)
      }
    } catch (e) {
      result.update = 'no version found'
      this.log.debug('[Config] Unable to parse result %s', strRegData)
    }
    this.log.debug('[Config] returning isDebug  %s', this.log.isDebugEnabled())
    result.debug = this.log.isDebugEnabled()
    this.log.debug('[Config] returning system info  %s', JSON.stringify(result))
    result.useAuth = this.useAuth
    result.useTLS = this.useTLS
    return result
  }

  // make it fucking Node8 compatible
  getHTTP (urlStr, options) {
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

  updateSystem () {
    // get the update command and run it
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
        return {'error': message}
      }
    }
  }

  restartSystem () {
    // get the update command and run it
    let packageFile = path.join(__dirname, '..', '..', 'package.json')
    if (fs.existsSync(packageFile)) {
      try {
        let packageData = JSON.parse(fs.readFileSync(packageFile))
        if ((packageData) && (packageData.scripts)) {
          let restartScript = packageData.scripts.restart
          if (restartScript) {
            const childprocess = require('child_process')
            setTimeout(() => {
              childprocess.execSync(restartScript)
            }, 500)
          }
        }
      } catch (e) {
        return {'error': 'unable to get the restart command'}
      }
    }
  }

  deviceWithUUID (uuid) {
    var result
    this.pluginAccessories.map(device => {
      if (device.UUID === uuid) {
        result = device
      }
    })
    return result
  }

  specialDeviceWithUUID (uuid) {
    var result
    this.pluginSpecial.map(device => {
      if (device.UUID === uuid) {
        result = device
      }
    })
    return result
  }

  bridgeWithId (uuid) {
    var result
    this.bridges.map(bridge => {
      if (bridge.id === uuid) {
        result = bridge
      }
    })
    return result
  }

  variableWithName (varName) {
    var result
    this.compatibleVariables.map(variable => {
      if (variable.name === varName) {
        result = variable
      }
    })
    return result
  }

  programWithName (progName) {
    var result
    this.compatiblePrograms.map(program => {
      if (program.name === progName) {
        result = program
      }
    })
    return result
  }

  serviceSettingsFor (channelAddress) {
    var result = {}
    result.service = []
    let self = this
    this.compatibleDevices.map(device => {
      device.channels.map(channel => {
        if (channel.address === channelAddress) {
          let s1 = self.services[channel.type]
          if (s1) {
            s1.map(item => {
              result.service.push(item)
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
    })
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
    return result
  }

  getVariableServiceList () {
    var result = []
    this.services['VARIABLE'].map(item => {
      result.push(item)
    })
    return result
  }

  loadSettings () {
    let configFile = path.join(process.env.UIX_CONFIG_PATH, 'config.json')
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile))
    }
    return undefined
  }

  saveSettings (configData) {
    let configFile = path.join(process.env.UIX_CONFIG_PATH, 'config.json')
    fs.writeFileSync(configFile, JSON.stringify(configData, ' ', 1))
  }

  saveDevice (data) {
    let name = data.name
    let channel = data.address
    var isSpecial

    if (channel === 'new:special') {
      isSpecial = uuid.generate('special_' + name)
      channel = isSpecial + ':0'
    }

    let instance = data.instanceID || uuid.generate('0')
    let service = data.serviceClass
    let settings = (data.settings) ? JSON.parse(data.settings) : {}

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
      return {'result': 'saved'}
    } else {
      return {'result': 'error saving'}
    }
  }

  createapplicancesWizzard (instanceID, listChannelz) {
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
    return {'result': 'saved'}
  }

  savePublishingFlag (bridges) {
    var configData = this.loadSettings() || {instances: {'0': {'name': 'default'}}}
    bridges.map(bridgeId => {
      let oBridge = configData.instances[bridgeId]
      oBridge.publishDevices = true
    })
    this.saveSettings(configData)
  }

  randomMac () {
    var mac = '12:34:56'

    for (var i = 0; i < 6; i++) {
      if (i % 2 === 0) mac += ':'
      mac += Math.floor(Math.random() * 16).toString(16)
    }

    return mac
  }

  generatePin () {
    let code = Math.floor(10000000 + Math.random() * 90000000) + ''
    code = code.split('')
    code.splice(3, 0, '-')
    code.splice(6, 0, '-')
    code = code.join('')
    return code
  }

  createMultipleInstances (payload) {
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
            let instData = {'name': name, 'user': mac, 'pincode': self.generatePin(), 'roomId': roomId}
            self.log.debug('[Config] will create instance %s', JSON.stringify(instData))
            configData.instances[newUUID] = instData
          }
        }
      })
      this.saveSettings(configData)
      this.process.send({
        topic: 'reloadApplicances'
      })
      return ({message: 'created', payload: configData.instances})
    } catch (e) {
      this.log.error(e)
      return {'error': e}
    }
  }

  createInstance (query) {
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
        configData.instances[newUUID] = {'name': name, 'user': mac, 'pincode': self.generatePin(), 'roomId': roomId}
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

  removeInstance (uuid) {
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

  removeDevice (uuid) {
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
      return {'result': 'deleted'}
    } else {
      return {'result': 'not found'}
    }
  }

  editInstance (query) {
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
        return {'result': 'saved'}
      }
    }
    return {'result': 'error name not filled or bridge not found'}
  }

  deactivateInstance (query) {
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
        return {'result': 'saved'}
      }
    }
    return {'result': 'bridge not found'}
  }

  saveObject (query, objectType) {
    this.log.debug('[Config] save %s', objectType)
    let serial = query.serial
    let newName = query.name || serial
    let instance = query.instanceID
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
      // add mapping data
      config.mappings[serial + ':0'] = {
        name: newName,
        instance: instance,
        Service: serviceClass,
        settings: {}
      }
      this.saveSettings(config)
      this.process.send({
        topic: 'reloadApplicances',
        uuid: uuid
      })
      return {'result': 'saved'}
    } else {
      return {'result': 'error name or serial or instance not found'}
    }
  }

  removeObject (serial, uuid, objectType) {
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
      return {'result': 'deleted'}
    } else {
      return {'result': 'not found'}
    }
  }

  saveVariableTrigger (datapoint) {
    if (datapoint) {
      let configData = this.loadSettings()
      configData.VariableUpdateEvent = datapoint
      this.saveSettings(configData)
      this.process.send({
        topic: 'reloadApplicances',
        uuid: uuid
      })
      return {'result': 'saved'}
    } else {
      return {'result': 'missing argument'}
    }
  }

  getRoombyId (roomID) {
    return this.pluginRooms.filter(room => room.id === roomID)[0] || undefined
  }

  generateRoomListWithSupportedDevices () {
    let result = []

    this.pluginRooms.map(room => {
      let oRoom = {id: room.id, name: room.name, devices: []}
      let cList = room.channels
      this.compatibleDevices.map(device => {
        var dCList = []
        device.channels.map(channel => {
          if ((cList.indexOf(channel.id) > -1) && (channel.isSuported === true)) {
            dCList.push(channel)
          }
        })
        if (dCList.length > 0) {
          let oDevice = {id: device.id, name: device.name, type: device.type, channels: dCList}
          oRoom.devices.push(oDevice)
        }
      })
      result.push(oRoom)
    })
    return result
  }

  saveGlobalSettings (query) {
    if (query.settings) {
      let oSettings = JSON.parse(query.settings)
      let config = this.loadSettings()

      if (config === undefined) {
        config = {}
      }
      config.useCCCAuthentication = ((oSettings.useAuth === true) || (oSettings.useAuth === 'true'))
      config.useTLS = ((oSettings.useTLS === true) || (oSettings.useTLS === 'true'))
      this.saveSettings(config)
    }
  }

  isValidCCUSession (sid) {
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

  fetchUpdateChangelog () {
    return new Promise(async (resolve, reject) => {
      let version = this.fetchVersion()
      let rgx = RegExp('([a-zA-Z 0-9.:\n=*]{1,})(?=Changelog for ' + version + ')')
      let strChangeLog = await this.getHTTP('https://raw.githubusercontent.com/thkl/hap-homematic/master/CHANGELOG.md', {headers: {'Cache-Control': 'no-cache'}})
      let rst = rgx.exec(strChangeLog)
      resolve(((rst) && (rst.length > 0)) ? rst[0] : 'No remote changelog found')
    })
  }

  async processApiCall (query, response) {
    // if we are using ccu's authentication system
    if (this.useAuth === true) {
      // check if the provide sid is valid and the user has level 8
      let validuser = await this.isValidCCUSession(query.sid)
      if (validuser === false) {
        this.log.error('[Config] invalid user')
        response.writeHead(401, 'Unauthorized')
        response.end('Unauthorized')
        return
      }
    }

    if (query.method) {
      var readStream
      switch (query.method) {
        /** returns all known devices */
        case 'devicelist':
          this.sendJSON(this.pluginAccessories, response)
          break
        /** returns all known variables */
        case 'variablelist':
          let srvList = this.getVariableServiceList()
          this.sendJSON({variables: this.pluginVariables, trigger: this.pluginVariableTrigger, services: srvList}, response)
          break

        /** returns all known programs */
        case 'programlist':
          this.sendJSON({programs: this.pluginPrograms}, response)
          break

        case 'speciallist':
          this.sendJSON({special: this.pluginSpecial}, response)
          break

        /** returns all known rooms */
        case 'roomlist':
          this.sendJSON({rooms: this.pluginRooms}, response)
          break

          /** returns all hap instances */
        case 'bridges':
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
            this.savePublishingFlag(JSON.parse(bridgesToPublish))
          }

          this.process.send({
            topic: 'reloadApplicances'
          })

          this.sendJSON({result: 'initiated'}, response)
          break

        /** send the list of compatible ccu devices back to the js application */
        case 'newDevice':
          // send a list with compatible devices
          var list = []
          this.compatibleDevices.map(device => {
            var lCha = []
            var oDev = {device: device.address, name: device.name, type: device.type}
            device.channels.map(channel => {
              if (channel.isSuported === true) {
                lCha.push({id: channel.id, address: channel.address, name: channel.name, type: channel.type})
              }
            })
            oDev.channels = lCha
            list.push(oDev)
          })
          this.sendJSON({devices: list}, response)
          break
        case 'createapplicanceswizzard':
          this.sendJSON(this.createapplicancesWizzard(query.instanceId, JSON.parse(query.payload)), response)
          break
        case 'newVariable':
          this.sendJSON({variables: this.compatibleVariables}, response)
          break

        case 'newProgram':
          this.sendJSON({programs: this.compatiblePrograms}, response)
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
            this.sendJSON({error: 'unknown variable'}, response)
          }
          break

        case 'saveProgram':
          if (this.programWithName(query.serial)) {
            this.sendJSON(this.saveObject(query, 'programs'), response)
          } else {
            this.sendJSON({error: 'unknown program'}, response)
          }
          break

        case 'saveVariableTrigger':
          this.sendJSON(this.saveVariableTrigger(query.datapoint), response)
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
          this.sendJSON({'response': 'ok'}, response)
          this.restartSystem()
          break

        case 'debug':
          this.process.send(
            {
              topic: 'debug',
              debug: (query.enable === 'true')
            }
          )
          this.sendJSON({'response': 'ok'}, response)
          break

        case 'saveSettings':
          this.saveGlobalSettings(query)
          this.sendJSON({'response': 'ok'}, response)
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
            this.sendJSON({error: 'changelog not found', path: cFile}, response)
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

        /** fallback */
        default:
          this.sendJSON({error: 'unknown method'}, response)
          break
      }
    } else {
      this.sendJSON({error: 'missing arguments'}, response)
    }
  }

  handleIncommingIPCMessage (message) {
    if (message.topic) {
      switch (message.topic) {
        case 'serverdata':
          if (message.accessories) {
            this.pluginAccessories = message.accessories
          }
          if (message.variables) {
            this.pluginVariables = message.variables
          }
          if (message.variableTrigger) {
            this.pluginVariableTrigger = message.variableTrigger
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

          break

        case 'bridges':

          this.bridges = message.bridges
          break
        case 'services':

          this.services = message.services
          break

        case 'compatibleObjects':
          this.compatibleDevices = message.devices
          this.compatibleVariables = message.variables
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
