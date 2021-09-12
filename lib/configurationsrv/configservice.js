const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os');
const CCU = require('./ccu');
const cors = require('cors');
const uuid = require('hap-nodejs').uuid;
const crypto = require('crypto');

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
        this.services = {}
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

    saveSettings(configData) {
        let configFile = path.join(process.env.UIX_CONFIG_PATH, 'config.json')
        fs.writeFileSync(configFile, JSON.stringify(configData, ' ', 1))
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
                if (typeof appl.settings.instance === 'object') {
                    appl.settings.instance.forEach(instID => {
                        let instance = this.bridgeWithId(appl.instanceID)
                        if (instance !== undefined) {
                            instNames.push(instance.displayName)
                        }
                    })
                } else {
                    let instance = this.bridgeWithId(appl.instanceID)
                    if (instance !== undefined) {
                        instNames.push(instance.displayName)
                    }
                }
                appl.instanceNames = instNames.join(',');
            })
        }
    }

    updateAccessoryAddress(aplList) {
        if (aplList !== undefined) {
            aplList.forEach(appl => {
                appl.address = `${appl.serial}:${appl.channel}`
            })
        }
    }

    updateBridges(bridgeList) {
        bridgeList.map(bridge => {
            bridge.canDelete = (bridge.id !== DEFAULTINSTANCE)
        })
        return bridgeList;
    }

    serviceSettingsFor(channelAddress) {
        var result = {}
        result.service = []
        let self = this
        if (this.compatibleDevices) {
            this.compatibleDevices.map(device => {
                if (device.channels) {
                    device.channels.map(channel => {
                        if (channel.address === channelAddress) {
                            let s1 = self.services[channel.type]
                            if (s1) {
                                s1.map(item => {
                                    // make sure we do not filter this device
                                    if ((item.filterDevice) && (item.filterDevice.indexOf(device.type) === -1)) {
                                        result.service.push(item)
                                    }
                                })
                            }
                            let s2 = self.services[device.type + ':' + channel.type]
                            if (s2) {
                                s2.map(item => {
                                    result.service.push(item)
                                })
                            }
                        }
                    })
                }
            })
            if (this.pluginSpecial) {
                // also map the special devices
                this.pluginSpecial.map(spdevice => {
                    let chadr = spdevice.serial + ':' + spdevice.channel
                    if (chadr === channelAddress) {
                        // find service
                        self.services['SPECIAL'].map(item => {
                            result.service.push(item)
                        })
                    }
                })
            }
        }
        return result
    }

    getServices(type) {
        return this.services[type];
    }

    createCompatibleDeviceList() {
        // send a list with compatible devices
        var list = []
        this.compatibleDevices.map(device => {
            var lCha = []
            var oDev = { device: device.address, name: device.name, type: device.type }
            device.channels.map(channel => {
                if (channel.isSuported === true) {
                    lCha.push({ id: channel.id, address: channel.address, name: channel.name, type: channel.type })
                }
            })
            oDev.channels = lCha
            list.push(oDev)
        })
        return list;
    }

    createCompatibleVariableList() {
        let varlist = this.allVariables.filter(variable => variable.isCompatible === true)
        return varlist;
    }

    randomMac() {
        var mac = '12:34:56'

        for (var i = 0; i < 6; i++) {
            if (i % 2 === 0) mac += ':'
            mac += Math.floor(Math.random() * 16).toString(16)
        }

        return mac.toUpperCase()
    }

    generatePin() {
        let code = Math.floor(10000000 + Math.random() * 90000000) + ''
        code = code.split('')
        code.splice(3, 0, '-')
        code.splice(6, 0, '-')
        code = code.join('')
        return code
    }

    generateSetupID() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const bytes = crypto.randomBytes(4)
        let setupID = ''

        for (var i = 0; i < 4; i++) {
            var index = bytes.readUInt8(i) % 26
            setupID += chars.charAt(index)
        }

        return setupID
    }

    checkUniqueInstanceName(instances, name) {
        let isUnique = true;
        Object.keys(instances).map(bridgeId => {
            let bridge = instances[bridgeId]
            if (bridge.name === name) {
                isUnique = false;
            }
        })
        return isUnique;
    }

    deleteInstance(instanceObjectId) {
        let bridge = this.bridgeWithId(instanceObjectId);
        if ((bridge !== undefined) && (bridge.id !== 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab')) {
            // first set all devices to the default bridge
            let config = this.loadSettings()
            if (config.mappings !== undefined) {
                Object.keys(config.mappings).map(deviceId => {
                    let device = config.mappings[deviceId]
                    if (device.instance === instanceObjectId) {
                        device.instance = 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab'
                    }
                })
            }
            delete config.instances[instanceObjectId]
            this.saveSettings(config)
            return true;
        }
        return false;
    }

    saveInstance(instanceObject) {
        this.log.debug('[Config] save Instance %s', JSON.stringify(instanceObject))
        let instanceUuid = instanceObject.id
        let bridge = this.bridgeWithId(instanceUuid)
        if (bridge === undefined) {
            this.log.debug('[Config] object %s not found create a new instance', instanceUuid);
            // Add a new one
            const name = instanceObject.displayName;
            const roomId = instanceObject.roomId;
            let configData = this.loadSettings()

            if (configData === undefined) {
                configData = {}
            }
            if (configData.instances === undefined) {
                configData.instances = {}
            }

            if (this.checkUniqueInstanceName(configData.instances, name) === true) {
                const newUUID = uuid.generate(String(Math.random()));
                const mac = this.randomMac();
                const setupID = this.generateSetupID();
                const pincode = this.generatePin();
                const newInstance = { 'name': name, 'user': mac, pincode, roomId, setupID }
                configData.instances[newUUID] = newInstance;
                this.saveSettings(configData)
                newInstance.displayName = `HomeMatic ${name}`;
                return newInstance;
            }

            return false

        } else {
            let name = instanceObject.displayName || bridge.displayName
            // Kill the HomeMatic at the front
            if (name.indexOf('HomeMatic') === 0) {
                name = name.substring(10);
            }
            const roomId = instanceObject.roomId || bridge.roomId
            const publishDevices = instanceObject.publishDevices || bridge.publishDevices
            this.log.debug('[Config] updating %s with %s', instanceUuid, name)
            // change the name in the config and reload everything
            let config = this.loadSettings()
            if ((config) && (config.instances)) {
                bridge.name = name;
                bridge.roomId = parseInt(roomId)
                bridge.publishDevices = publishDevices
                config.instances[instanceUuid] = bridge
                this.saveSettings(config)
                return bridge;
            }
        }
        return false;
    }


    async saveDevice(data) {
        console.log(data);
        let name = data.name
        let channel = data.address
        var isSpecial

        if (channel === 'new:special') {
            isSpecial = uuid.generate('special_' + name)
            channel = isSpecial + ':0'
        }

        let settings = ((data.settings) && (data.settings.settings)) ? data.settings.settings : {}

        let instance = uuid.generate('0')

        if (settings.instanceIDs !== undefined) {
            this.log.debug('[Config] settings up instances')
            instance = []
            Object.keys(settings.instanceIDs).map((oKey) => {
                instance.push(settings.instanceIDs[oKey])
            })
        } else {
            // if not in settings ... so use the first we'vfound
            if (data['instanceIDs[0]']) {
                instance = data['instanceIDs[0]']
            } else if (data.instanceID) {
                instance = data.instanceID;
            }
        }

        let service = data.serviceClass

        if ((name) && (channel) && (service)) {
            var configData = this.loadSettings()
            // generate the containers if not here yet
            if (configData === undefined) {
                configData = {}
            }
            if (configData.mappings === undefined) {
                configData.mappings = {}
            }

            if (configData.channels === undefined) {
                configData.channels = []
            }

            if (configData.variables === undefined) {
                configData.variables = []
            }

            if (configData.special === undefined) {
                configData.special = []
            }



            // remove settings which are not part of the class settings
            let clazzFile = path.join(__dirname, '..', 'services', service + '.js')
            if (fs.existsSync(clazzFile)) {
                let oClazz = require(clazzFile)
                let oClazzSettings = await oClazz.configurationItems()
                Object.keys(settings).map((key) => {
                    if (Object.keys(oClazzSettings).indexOf(key) === -1) {
                        delete settings[key]
                        this.log.debug('[Config] removed %s which is not part of %s settings.', key, service)
                    }
                })
            } else {
                this.log.debug('[Config] clazzFile %s not found', clazzFile)
            }


            // Add the mapping
            configData.mappings[channel] = {
                name: name,
                Service: service,
                instance: instance,
                settings: settings
            }

            switch (data.applianceType) {
                case 'HapDevice':
                    if (configData.channels.indexOf(channel) === -1) {
                        // Add the Channel if not here .. otherwise just override the config
                        configData.channels.push(channel)
                    }
                    break
                case 'HapVariable':
                    if (configData.variables.indexOf(data.nameInCCU) === -1) {
                        configData.variables.push(data.nameInCCU)
                    }
                    break
                case 'HapProgram':
                    break
                case 'HapSpecial':
                    // There is a Special Array so put this also in
                    if (configData.special.indexOf(isSpecial) === -1) {
                        configData.special.push(isSpecial)
                    }
                    break;
            }
            // Save the stuff
            console.log(configData);
            this.saveSettings(configData)
            return true
        } else {
            this.log.error('Some stuff is missing Name %s, Channel %s, Service %s', name, channel, service);
            return false
        }
    }

    removeObject(address) {
        let configData = this.loadSettings()
        if ((configData.mappings) && (configData.mappings[address])) {
            this.log.debug('[Config] will remove device with address %s', address)

            if ((configData) && (configData.mappings)) {
                this.log.debug('[Config] remove mapping configuration')
                delete configData.mappings[address]
            }


            if ((configData) && (configData.channels)) {
                let index = configData.channels.indexOf(address)
                if (index > -1) {
                    this.log.debug('[Config] channel data found .. remove')
                    configData.channels.splice(index, 1)
                }
            }

            let split = address.split(':')[0];

            if ((configData) && (configData.variables)) {
                let index = configData.variables.indexOf(split)
                if (index > -1) {
                    this.log.debug('[Config] variable data found .. remove')
                    configData.variables.splice(index, 1)
                }
            }

            if ((configData) && (configData.programs)) {
                let index = configData.programs.indexOf(split)
                if (index > -1) {
                    this.log.debug('[Config] program data found .. remove')
                    configData.programs.splice(index, 1)
                }
            }

            // remove it from special if its there
            if ((configData) && (configData.special)) {
                let index = configData.special.indexOf(address)
                if (index > -1) {
                    this.log.debug('[Config] special entry found ... remove')
                    configData.special.splice(index, 1)
                }
            }

            this.saveSettings(configData)
            return true;
        } else {
            return false;
        }
    }


    commandReload() {
        this.process.send({
            topic: 'reloadApplicances',
            uuid: uuid
        })
    }

    handleIncommingIPCMessage(message) {
        switch (message.topic) {
            case 'bridges':
                this.bridges = this.updateBridges(message.bridges);
                this.updateInstanceNames(this.pluginPrograms);
                this.updateAccessoryAddress(this.pluginPrograms);
                this.updateInstanceNames(this.pluginAccessories);
                this.updateAccessoryAddress(this.pluginAccessories);
                this.updateInstanceNames(this.pluginVariables);
                this.updateAccessoryAddress(this.pluginVariables);
                this.updateInstanceNames(this.pluginSpecial);
                this.updateAccessoryAddress(this.pluginSpecial);
                break


            case 'serverdata':
                this.log.debug('Incomming IPC Serverdata: %s', JSON.stringify(message))
                if (message.accessories) {
                    this.pluginAccessories = message.accessories
                    this.updateInstanceNames(this.pluginAccessories);
                    this.updateAccessoryAddress(this.pluginAccessories);
                }
                if (message.variables) {
                    this.pluginVariables = message.variables
                    this.updateInstanceNames(this.pluginVariables);
                    this.updateAccessoryAddress(this.pluginVariables);
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
                    this.updateAccessoryAddress(this.pluginPrograms);
                }
                if (message.rooms) {
                    this.pluginRooms = message.rooms
                }

                if (message.special) {
                    this.pluginSpecial = message.special
                    this.updateInstanceNames(this.pluginSpecial);
                    this.updateAccessoryAddress(this.pluginSpecial);
                }

                if (message.logfile) {
                    this.logfile = message.logfile
                }
                this.sendObjects()
                break

            case 'services':
                this.log.debug('Services :%s', JSON.stringify(message.services))
                this.services = message.services
                break

            case 'compatibleObjects':
                this.compatibleDevices = message.devices
                this.allVariables = message.variables
                this.compatiblePrograms = message.programs
                break
        }
    }
}
