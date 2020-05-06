const path = require('path')
const Server = require(path.join(__dirname, 'lib', 'Server.js'))
const Logger = require(path.join(__dirname, 'lib', 'logger.js'))
const program = require('commander')
const os = require('os')
const fs = require('fs')

process.name = 'hap-homematic'

let log = new Logger('HAP Server')
var configurationPath = path.join('/usr/local/etc/config/addons/', process.name)
var simulation
var dryRun

program.option('-D, --debug', 'turn on debug level logging', () => {
  log.setDebugEnabled(true)
})

program.option('-C, --configuration [path]', 'set configuration path', (configuration) => {
  configurationPath = configuration
})

program.option('-S, --simulate [path]', 'simulate with a devices file', (devFile) => {
  console.log('Running a simulation with %s', devFile)
  simulation = devFile
})

program.option('-R, --dryrun', 'only use cached files', () => {
  dryRun = true
})

  .parse(process.argv)

process.on('uncaughtException', (err) => {
  // Write a crashlog
  const fs = require('fs')
  let crashFile = path.join(configurationPath, Date.now() + '.crash')
  var msg = 'Error log : ' + new Date() + '\n\n'
  msg = msg + err.stack
  fs.writeFileSync(crashFile, msg)
  // gracefull shutdown ;o)
  log.error('uncaughtException  log will be found in %s exiting now', crashFile)
  console.log(err.stack)
  log.close()
  process.exit(1) // mandatory (as per the Node docs)
})

if (fs.existsSync('/var/log')) {
  log.setLogFile(path.join('/var/log', 'hap-homematic.log'))
} else {
  let tmpDir = fs.realpathSync(os.tmpdir())
  log.setLogFile(path.join(tmpDir, 'hap-homematic.log'))
}

// check if there is a .hapdebug in /tmp and switch on the debug mode then
let fdebug = path.join(fs.realpathSync(os.tmpdir()), '.hapdebug')
if (fs.existsSync(fdebug)) {
  log.setDebugEnabled(true)
  fs.unlinkSync(fdebug) // remove the flag
}

log.info('---- launching ----')
log.info('Welcome to HAP Homematic. Use your HomeMatic devices in HomeKit')
log.info('(c) 2020 by @thkl - https://github.com/thkl/hap-homematic')

var server

if (simulation !== undefined) {
  let simPath = path.join(configurationPath, simulation)
  log.warn('Doing a device file simulation with %s', simulation, simPath)
  server = new Server(log)
  server.simulate(simPath)
} else {
  log.debug('Initializing Server')
  server = new Server(log, configurationPath)
  server.init(dryRun)
}

process.on('SIGTERM', () => {
  server.shutdown()
  log.close()
})

process.on('SIGINT', () => {
  server.shutdown()
  log.close()
})
