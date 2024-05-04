/*
 * **************************************************************
 * File: cfglogger.js
 * Project: hap-homematic
 * File Created: Monday, 4th October 2021 2:32:12 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:24:08 pm
 * Modified By: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Copyright 2020 - 2021 @thkl / github.com/thkl
 * -----
 * **************************************************************
 * MIT License
 * 
 * Copyright (c) 2021 github.com/thkl
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * **************************************************************
 */

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
        let rawMsg = '[ConfigServer] ' + util.format.apply(util, Array.prototype.slice.call(arguments, 1))

        this.process.send({
            topic: 'logdata',
            lvl: level,
            msg: rawMsg
        })

    }
}