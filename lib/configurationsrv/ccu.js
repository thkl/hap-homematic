const fs = require('fs');
const path = require('path');
const http = require('http');
const Rega = require(path.join(__dirname, '..', 'HomeMaticRegaRequest.js'))

class CCU {

    init(host, log) {
        this.log = log;
        this.host = host || '127.0.0.1';
        this.sidRequired = false;
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

            const req = http.request(options, (res) => {
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

    async ccuCGICall(sid, method, parameters) {
        let lParameters = { '_session_id_': sid }
        if (parameters) {
            Object.keys(parameters).map((key) => {
                lParameters[key] = parameters[key]
            })
        }
        let body = { 'version': '1.1', 'method': method, 'params': lParameters }
        let result = await this.postRequest(80, '/api/homematic.cgi', JSON.stringify(body))
        try {
            return JSON.parse(result)
        } catch (e) {
            return {}
        }
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