/*
 * **************************************************************
 * File: ccu.js
 * Project: hap-homematic
 * File Created: Monday, 4th October 2021 2:32:12 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:24:17 pm
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

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { resolve } = require('path');
const Rega = require(path.join(__dirname, '..', 'HomeMaticRegaRequest.js'))

class CCU {

    init(host, log) {
        this.log = log;
        this.host = host || '127.0.0.1';
        this.sidRequired = false;
        this.tls = false
        this.httpClient = http;
    }

    useTLS(cert) {
        this.tls = true;
        this.httpClient = https;
        this.cert = cert;
    }

    async getFirewallConfiguration() {
        // get the /etc/config/firewall.conf
        let config = {}
        let fireWallConfig = path.join('/', 'etc', 'config', 'firewall.conf')
        if (fs.existsSync(fireWallConfig)) {
            let dta = fs.readFileSync(fireWallConfig)
            if (dta) {
                let rgxMode = /MODE.=.([a-zA-Z_]{1,})/
                let rgxModeParts = rgxMode.exec(dta)
                if ((rgxModeParts) && (rgxModeParts.length > 1)) {
                    config.mode = rgxModeParts[1]
                }
                let rgxPorts = /USERPORTS.=.([0-9 ]{1,})/
                let rgxPortsParts = rgxPorts.exec(dta)
                if ((rgxPortsParts) && (rgxPortsParts.length > 1)) {
                    config.userports = rgxPortsParts[1].split(' ')
                }
            } else {
                this.log.error('[Config] firewallConfig not readable')
            }
        } else {
            this.log.error('[Config] unable to find firewall config %s', fireWallConfig)
        }
        return config
    }


    loadScript(name, args) {

        let named = ((args !== undefined) && (Array.isArray(args) === false))

        let sname = path.join(__dirname, 'scripts', name + '.txt')
        if (fs.existsSync(sname)) {
            let scrpt = fs.readFileSync(sname, "utf8").toString();
            if (scrpt) {
                if (named === true) {
                    Object.keys(args).forEach(key => {
                        let rx = new RegExp(`%${key}%`, "g");
                        scrpt = scrpt.replace(rx, args[key]);
                    })
                } else {
                    let idx = 0;
                    args.forEach(arg => {
                        idx = idx + 1;
                        let rx = new RegExp('%' + idx, "g");
                        scrpt = scrpt.replace(rx, arg)
                    })
                }
            }
            return scrpt
        } else { return '' }
    }

    ccuGetDatapoints(channelID) {
        let self = this
        return new Promise((resolve, reject) => {
            const scrpt = self.loadScript('getdatapoints', {
                channelID: channelID
            })

            let rega = new Rega(self.log, self.host)
            rega.script(scrpt).then(regaResult => {
                try {
                    resolve(JSON.parse(regaResult));
                } catch (e) {
                    reject(e);
                }
            });
        })
    }


    ccuGetDevices(channelTypes) {
        const self = this
        return new Promise(async (resolve, reject) => {
            if (self.allDevices === undefined) {
                const scrpt = self.loadScript('getalldevices', {})
                const rega = new Rega(self.log, self.host)
                try {
                    const regaResult = await rega.script(scrpt);
                    const allDevices = JSON.parse(regaResult);
                    self.allDevices = allDevices.devices;
                } catch (e) {
                    reject(e);
                }
            }

            const result = self.allDevices.filter(device => {
                const chnl = device.channels.filter(channel => channelTypes.indexOf(channel.type) > -1)
                return chnl.length > 0
            })
            resolve(result)
        });
    }

    postRequest(port, path, body) {
        let self = this;
        return new Promise((resolve, reject) => {
            const options = {
                hostname: self.host,
                port: port,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': body.length
                }
            }
            if (this.tls) {
                options.port = 443;
                if (self.cert) {
                    options.ca = self.cert;
                    // we have to swich cert check off cause we will connect to 127.0.0.1 and the cert will use the correct ip
                    options.rejectUnauthorized = false;
                } else {
                    // dissable cert check
                    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
                }
            }
            const req = self.httpClient.request(options, (res) => {
                var data = ''
                res.on('data', (d) => {
                    data = data + d
                })

                res.on('end', () => {
                    resolve(data)
                })
            })

            req.on('error', (error) => {
                reject(error)
            })

            req.write(body)
            req.end()
        })
    }


    async renewCCUSession(sid) {
        await this.ccuCGICall(sid, 'Session.renew')
    }

    ccuCGICall(sid, method, parameters) {
        const self = this
        return new Promise(async (resolve, reject) => {
            let lParameters = {}
            if (sid) {
                lParameters = { '_session_id_': sid }
            }
            if (parameters) {
                Object.keys(parameters).map((key) => {
                    lParameters[key] = parameters[key]
                })
            }
            let body = { "version": "1.1", "method": method, "params": lParameters }
            let result = await self.postRequest(80, '/api/homematic.cgi', JSON.stringify(body))
            try {
                const rs = JSON.parse(result)
                if (rs !== undefined) {
                    resolve(rs.result)
                } else {
                    resolve(undefined);
                }
            } catch (e) {
                console.log(e)
                return {

                }
            }
        })
    }

    login(user, password) {
        let self = this
        return new Promise(async (resolve, reject) => {
            const rsl = await self.ccuCGICall(undefined, 'Session.login', { "username": user, "password": password })
            resolve(rsl)
        })
    }

    isValidCCUSession(sid) {
        let self = this
        return new Promise((resolve, reject) => {
            // first remove the @ char
            let regex = /@([0-9a-zA-Z]{10})@/g
            let prts = regex.exec(sid)
            if ((prts) && (prts.length > 1)) {
                let script = 'Write(system.GetSessionVarStr(\'' + prts[1] + '\'));'
                let rega = new Rega(self.log, self.host)
                rega.script(script).then(regaResult => {
                    let rgx = /^([0-9]*);([0-9])*;([^;]*);([^;]*);([^;]*);$/
                    let usrPrts = rgx.exec(regaResult)
                    if ((usrPrts) && (usrPrts.length > 2)) {
                        self.renewCCUSession(prts[1]) // renew the session in ccu
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


}

// export a singleton
exports = module.exports = new CCU();