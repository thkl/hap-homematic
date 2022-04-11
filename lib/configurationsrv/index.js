/*
 * **************************************************************
 * File: index.js
 * Project: hap-homematic
 * File Created: Monday, 4th October 2021 2:29:18 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:23:39 pm
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
