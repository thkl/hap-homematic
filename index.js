const path = require('path')
const Server = require(path.join(__dirname, 'lib', 'Server.js'))
const Logger = require(path.join(__dirname, 'lib', 'logger.js')).Logger
const program = require('commander')
process.name = 'hap-homematic'

let log = new Logger('HAP Server')
var configurationPath = path.join('/usr/local/etc/config/addons/', process.name)

program.option('-D, --debug', 'turn on debug level logging', function () {
  log.setDebugEnabled(true)
})
program.option('-C, --configuration', 'set configuration path', function (configuration) {
  configurationPath = configuration
}).parse(process.argv)

log.info('Welcome to HAP Homematic. Use your HomeMatic devices in HomeKit')
let server = new Server(log, configurationPath)
log.debug('Initializing Server')
server.init()

process.on('SIGTERM', () => {
  server.shutdown()
})

process.on('SIGINT', () => {
  server.shutdown()
})
