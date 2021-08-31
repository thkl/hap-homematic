const ConfigurationService = require('./configservice');
const path = require('path');
const Logger = require(path.join(__dirname, '..', 'logger.js'));

let logger = new Logger('HAP ConfigServer')
logger.setDebugEnabled(process.env.UIX_DEBUG)
let pcs = new ConfigurationService(logger)
pcs.init();
pcs.run();
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
