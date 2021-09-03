const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os');
const CCU = require('./ccu');
const cors = require('cors');

const SocketManager = require('./socketmanager');
const DEFAULTINSTANCE = 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab';

module.exports = class ConfigurationService {
    constructor(logger) {
        this.log = logger
        this.configServerPort = 9874
        this.programs = []
        this.variables = []
        this.pluginAccessories = []
        this.bridges = []
        this.allVariables = []
        this.compatibleDevices = []
    }

    init() {
        const self = this;

        this.config = this.loadSettings()

        CCU.init(process.env.UIX_CCUHOST || '127.0.0.1', this.log);
        CCU.sidRequired = this.config.useCCCAuthentication;

        this.app = express();
        this.app.use(cors())
        this.app.use(express.json());

        const staticFiles = path.join(__dirname, 'client');
        this.app.use('/', express.static(staticFiles));

        let routePath = path.join(__dirname, 'routes');
        fs.readdir(routePath, async (err, items) => {
            items.forEach((item) => {
                if (item.match(/.*_route.js/)) {
                    self.log.debug('[Config] processing route file %s', item)
                    self.app.use('/api', require(path.join(__dirname, 'routes', item))(this));
                }
            });
        });


        let keyFile = '/etc/config/server.pem'
        let certFile = '/etc/config/server.pem'
        if ((this.config.useTLS === true) && (fs.existsSync(keyFile)) && (fs.existsSync(certFile))) {
            // Just use Homematics TLS Certificate :o)
            const privateKey = fs.readFileSync(keyFile, 'utf8')
            const certificate = fs.readFileSync(certFile, 'utf8')
            const credentials = { key: privateKey, cert: certificate }
            try {
                this.server = this.createServer(credentials);
            } catch (e) {
                this.server = this.createServer();
            }

        } else {
            this.server = this.createServer();
        }

        SocketManager.connect(this.log, this.server);
        SocketManager.getSystemInfo = async () => {
            return self.getSystemInfo();
        }
    }

    createServer(credentials) {
        if (credentials) {
            this.log.debug('Creating an https server');
            return https.createServer(credentials, this.app);
        }
        this.log.debug('Creating an http server');
        return http.createServer(this.app);
    }

    run() {
        const self = this;
        this.server.listen(this.configServerPort, () => {
            self.log.info('Config server listening on port %s', self.configServerPort);
        })
    }

    loadSettings() {
        let configFile = path.join(process.env.UIX_CONFIG_PATH, 'config.json')
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile))
        }
        return {}
    }

    shutdown() {
        this.server.close()
        this.log.close()
    }

    getVariableServiceList() {
        var result = []
        if ((this.services) && (this.services.VARIABLE)) {
            this.services.VARIABLE.map(item => {
                result.push(item)
            })
        }
        return result
    }


    async getSystemInfo() {
        var result = {}
        result.cpu = os.cpus()
        result.mem = os.freemem()
        result.uptime = os.uptime()
        result.hapuptime = process.uptime()
        result.version = this.fetchVersion()
        result.update = result.version // set to the same version per default.
        // check  my version
        this.log.debug('[Config] Check Registry Version')
        let strRegData = ''
        try {
            strRegData = await this.getHTTP('https://registry.npmjs.org/hap-homematic', {})
            let oReg = JSON.parse(strRegData)
            if (oReg) {
                result.update = oReg['dist-tags'].latest
                this.log.debug('[Config] Found Registry Version %s', oReg['dist-tags'].latest)
            } else {
                this.log.debug('[Config] Unable to parse result %s', strRegData)
            }
        } catch (e) {
            this.log.debug('[Config] Unable to parse result %s', strRegData)
        }
        result.debug = this.log.isDebugEnabled()
        result.useAuth = this.useAuth
        result.useTLS = this.useTLS
        result.enableMonitoring = this.enableMonitoring
        result.disableHistory = this.disableHistory
        result.forceRefresh = this.forceRefresh
        result.forceCache = this.forceCache
        result.interfaceWatchdog = this.interfaceWatchdog
        this.forceRefresh = false
        return result
    }

    fetchVersion() {
        let packageFile = path.join(__dirname, '..', '..', 'package.json')
        this.log.debug('[Config] Check Version from %s', packageFile)
        if (fs.existsSync(packageFile)) {
            try {
                this.packageData = JSON.parse(fs.readFileSync(packageFile))
                this.log.debug('[Config] version is %s', this.packageData.version)
                return this.packageData.version
            } catch (e) {
                return 'no version found'
            }
        }
        return 'no version found'
    }

    // make it fucking Node8 compatible
    getHTTP(urlStr, options) {
        return new Promise((resolve, reject) => {
            if (!options) {
                options = {}
            }
            var q = url.parse(urlStr, true)
            options.path = q.pathname
            options.host = q.hostname
            options.port = q.port

            https.get(options, (resp) => {
                let data = ''

                resp.on('data', (chunk) => {
                    data += chunk
                })

                resp.on('end', () => {
                    resolve(data)
                })
            }).on('error', (err) => {
                reject(err)
            })
        })
    }

    async sendObjects() {
        this.log.debug('sendObjects fetching firewall data')
        // check the current firewall settings match the used ports
        let data = await CCU.getFirewallConfiguration();
        let fwConfig = data
        if (fwConfig) {
            this.log.debug('fw Config found %s', fwConfig)
            this.bridges.map((bridge) => {
                if ((fwConfig.mode) && (fwConfig.mode === 'MOST_OPEN')) {
                    bridge.ccuFirewall = true
                } else
                    if ((fwConfig.mode) && (fwConfig.mode === 'RESTRICTIVE') && (fwConfig.userports) && (fwConfig.userports.indexOf(String(bridge.port)) > -1)) {
                        bridge.ccuFirewall = true
                    } else {
                        bridge.ccuFirewall = false
                    }
            })
        }
        const socketPayload = {
            accessories: this.pluginAccessories,
            variables: this.pluginVariables,
            variableTrigger: this.pluginVariableTrigger,
            autoUpdateVarTriggerHelper: this.autoUpdateVarTriggerHelper,
            variableServices: this.getVariableServiceList(),
            programs: this.pluginPrograms,
            rooms: this.pluginRooms,
            special: this.pluginSpecial,
            bridges: this.bridges,
            ccuDevices: this.compatibleDevices
        }

        this.log.debug('send Socket Message %s', JSON.stringify(socketPayload));
        SocketManager.sendMessageToSockets({
            message: 'serverdata',
            payload: socketPayload
        })

    }

    bridgeWithId(uuid) {
        var result
        this.bridges.map(bridge => {
            if (bridge.id === uuid) {
                result = bridge
            }
        })
        return result
    }

    updateInstanceNames(aplList) {
        const self = this
        if (aplList !== undefined) {
            aplList.forEach(appl => {
                appl.instanceNames = '';
                const instNames = [];
                let instance = this.bridgeWithId(appl.instanceID)
                if (instance !== undefined) {
                    instNames.push(instance.displayName)
                }
                appl.instanceNames = instNames.join(',');
            })
        }
    }

    updateBridges(bridgeList) {
        bridgeList.map(bridge => {
            bridge.canDelete = (bridge.id !== DEFAULTINSTANCE)
        })
        return bridgeList;
    }

    handleIncommingIPCMessage(message) {
        switch (message.topic) {
            case 'bridges':
                this.bridges = this.updateBridges(message.bridges);
                this.updateInstanceNames(this.pluginPrograms);
                this.updateInstanceNames(this.pluginAccessories);
                this.updateInstanceNames(this.pluginVariables);
                this.updateInstanceNames(this.pluginSpecial);
                break


            case 'serverdata':
                this.log.debug('Incomming IPC Serverdata: %s', JSON.stringify(message))
                if (message.accessories) {
                    this.pluginAccessories = message.accessories
                    this.updateInstanceNames(this.pluginAccessories);
                }
                if (message.variables) {
                    this.pluginVariables = message.variables
                    this.updateInstanceNames(this.pluginVariables);
                }
                if (message.variableTrigger) {
                    this.pluginVariableTrigger = message.variableTrigger
                }
                if (message.autoUpdateVarTriggerHelper) {
                    this.autoUpdateVarTriggerHelper = message.autoUpdateVarTriggerHelper
                }
                if (message.programs) {
                    this.pluginPrograms = message.programs
                    this.updateInstanceNames(this.pluginPrograms);
                }
                if (message.rooms) {
                    this.pluginRooms = message.rooms
                }

                if (message.special) {
                    this.pluginSpecial = message.special
                    this.updateInstanceNames(this.pluginSpecial);
                }

                if (message.logfile) {
                    this.logfile = message.logfile
                }
                this.sendObjects()
                break
        }
    }
}