const path = require('path')
const fs = require('fs')
const http = require('http')
const url = require('url')
const qs = require('querystring')
const uuid = require('hap-nodejs').uuid
const Logger = require(path.join(__dirname, '..', 'logger.js')).Logger

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
  }

  shutdown () {
    this.server.close()
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
        'Content-Length': stat.size
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
    this.log.info('[Config] Running Configuration Service')

    function handleRequest (request, response) {
      if (request.method === 'POST') {
        var body = ''
        request.on('data', function (data) {
          body += data
          if (body.length > 1e6) {
            request.connection.destroy()
          }
        })

        request.on('end', function () {
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

    this.server = http.createServer(handleRequest)
    this.server.listen(this.configServerPort, function () {
      self.log.info('[Config] Running Configuration Server on Port %s', self.configServerPort)
    })
  }

  getSystemInfo () {
    var os = require('os')
    var result = {}
    result.cpu = os.cpus()
    result.mem = os.freemem()
    return result
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

  bridgeWithId (uuid) {
    var result
    this.bridges.map(bridge => {
      if (bridge.id === uuid) {
        result = bridge
      }
    })
    return result
  }

  serviceSettingsFor (channelAddress) {
    var result = {}
    let self = this
    this.compatibleDevices.map(device => {
      device.channels.map(channel => {
        if (channel.address === channelAddress) {
          result.service = self.services[channel.type]
        }
      })
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
    let instance = data.instanceID || uuid.generate('0')
    let service = data.serviceClass
    let settings = (data.settings) ? JSON.parse(data.settings) : {}
    console.log(settings)
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

  createInstance (query) {
    let self = this
    return new Promise((resolve, reject) => {
      let name = query.name
      let publish = query.publish
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
        configData.instances[newUUID] = {'name': name, 'user': mac, 'pincode': self.generatePin()}
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
            device.id = 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab'
          }
        })
      }
      delete config.instances[uuid]
      this.saveSettings(config)
    }
  }

  removeDevice (uuid) {
    let device = this.deviceWithUUID(uuid)
    if (device) {
      // remove the channel and the settings
      let configData = this.loadSettings()
      let address = device.serial + ':' + device.channel
      if ((configData) && (configData.channels)) {
        let index = configData.channels.indexOf(address)
        if (index > -1) {
          configData.channels.splice(index, 1)
        }
      }
      if ((configData) && (configData.mappings)) {
        delete configData.mappings[address]
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
    this.log.debug('[Config] updating %s with %s', uuid, name)
    let bridge = this.bridgeWithId(uuid)
    this.log.debug('[Config] bridge %s', (bridge !== undefined))
    if ((bridge) && (name)) {
      // change the name in the config and reload everything
      let config = this.loadSettings()
      if ((config) && (config.instances)) {
        let instance = config.instances[uuid]
        instance.name = name
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

  async processApiCall (query, response) {
    if (query.method) {
      switch (query.method) {
        /** returns all known devices */
        case 'devicelist':
          this.sendJSON(this.pluginAccessories, response)
          break
          /** returns all hap instances */
        case 'bridges':
          this.sendJSON(this.bridges, response)
          break
          /** returns system informations */
        case 'system':
          this.sendJSON(this.getSystemInfo(), response)
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
        case 'new':
          // send a list with compatible devices
          var list = []
          this.compatibleDevices.map(device => {
            var lCha = []
            var oDev = {device: device.address, name: device.name, type: device.type}
            device.channels.map(channel => {
              if (channel.isSuported === true) {
                lCha.push({address: channel.address, name: channel.name, type: channel.type})
              }
            })
            oDev.channels = lCha
            list.push(oDev)
          })
          this.sendJSON({devices: list}, response)
          break

        /** returns the list of known services */
        case 'service':
          this.sendJSON(this.serviceSettingsFor(query.channelAddress), response)
          break

        /** save a new device */
        case 'savenew':
          this.sendJSON(this.saveDevice(query), response)
          break

        case 'saveDevice':
          this.sendJSON(this.saveDevice(query), response)
          break
        /** remove a device */
        case 'remove':
          this.sendJSON(this.removeDevice(query.uuid), response)
          break

        /** creates a new hap instance */
        case 'createinstance':
          let newBridgeList = await this.createInstance(query)
          this.sendJSON(newBridgeList, response)
          break

          /** edit the name of an instance */
        case 'editinstance':
          this.sendJSON(this.editInstance(query), response)
          break

        /** fallback */
        default:
          this.sendJSON({error: 'unknown method'}, response)
          break
      }
    }
  }

  handleIncommingIPCMessage (message) {
    if (message.topic) {
      this.log.debug('[Config] incomming message: %s', JSON.stringify(message))
      switch (message.topic) {
        case 'accessories':
          this.pluginAccessories = message.accessories
          break
        case 'bridges':
          this.bridges = message.bridges
          break
        case 'services':
          this.services = message.services
          break
        case 'compdevices':
          this.compatibleDevices = message.devices
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
    logger.info('[Config] Shutdown Configuration Service')
    pcs.shutdown()
    process.exit(1)
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
