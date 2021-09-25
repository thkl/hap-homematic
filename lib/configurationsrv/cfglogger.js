
var DEBUG_ENABLED = false
const util = require('util')

module.exports = class Logger {


    constructor(process) {
        this.process = process
    }

    setDebugEnabled(enabled) {
        DEBUG_ENABLED = enabled
    }
    isDebugEnabled() {
        return DEBUG_ENABLED
    }

    debug(msg) {
        if (DEBUG_ENABLED) {
            this.log.apply(this, ['debug'].concat(Array.prototype.slice.call(arguments)))
        }
    }

    info(msg) {
        this.log.apply(this, ['info'].concat(Array.prototype.slice.call(arguments)))
    }

    warn(msg) {
        this.log.apply(this, ['warn'].concat(Array.prototype.slice.call(arguments)))
    }

    error(msg) {
        this.log.apply(this, ['error'].concat(Array.prototype.slice.call(arguments)))
    }

    log(level, msg) {
        let rawMsg = '[ConfigServer]' + util.format.apply(util, Array.prototype.slice.call(arguments, 1))

        this.process.send({
            topic: 'logdata',
            lvl: level,
            msg: rawMsg
        })

    }
}