const ConfigurationService = require('./configservice');
const path = require('path');
const Logger = require('./cfglogger')

const logger = new Logger(process);


let pcs = new ConfigurationService(logger)

pcs.init();
pcs.run();
pcs.process = process


logger.info('server is up and running messaging daemon about that')
process.send({
    topic: 'cfghello'
})

setInterval(() => {
    if (!process.connected) {
        console('Shutdown Configuration Service')
        pcs.shutdown()
        process.exit()
    }
}, 10000)

process.on('message', (message) => {
    pcs.handleIncommingIPCMessage(message)
})

process.on('disconnect', () => {
    logger.info('Shutdown Configuration Service')
    pcs.shutdown()
    process.exit()
})
