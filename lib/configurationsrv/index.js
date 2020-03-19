const path = require('path')
const fs = require('fs')
const http = require('http')
const url = require('url')
const qs = require('querystring')

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

  saveNewDevice (data) {
    let name = data.name
    let channel = data.channel
    let instance = data.instance || 0
    let service = data.service

    if ((name) && (channel) && (service)) {
      var configData = this.loadSettings() || {mappings: {}, channels: []}
      // Add the mapping
      configData.mappings[channel] = {
        name: name,
        Service: service,
        instance: parseInt(instance)
      }

      if (configData.channels.indexOf(channel) === -1) {
      // Add the Channel if not here .. otherwise just override the config
        configData.channels.push(channel)
      }
      // Save the stuff
      this.saveSettings(configData)
      return {'result': 'saved'}
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
        configData.mappings[address] = undefined
      }
      this.saveSettings(configData)

      this.process.send({
        topic: 'reloadApplicances'
      })
      return {'result': 'deleted'}
    } else {
      return {'result': 'not found'}
    }
  }

  processApiCall (query, response) {
    if (query.method) {
      switch (query.method) {
        case 'devicelist':
          this.sendJSON(this.pluginAccessories, response)
          break
        case 'bridges':
          this.sendJSON(this.bridges, response)
          break
        case 'system':
          this.sendJSON(this.getSystemInfo(), response)
          break
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

        case 'service':
          this.sendJSON(this.serviceSettingsFor(query.channelAddress), response)
          break

        case 'savenew':
          this.sendJSON(this.saveNewDevice(query), response)
          break

        case 'remove':
          this.sendJSON(this.removeDevice(query.uuid), response)
          break

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
