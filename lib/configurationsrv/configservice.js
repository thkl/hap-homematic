const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const CCU = require('./ccu');
const cors = require('cors');
const uuid = require('hap-nodejs').uuid;
const crypto = require('crypto');
const SocketManager = require('./socketmanager');
const Settings = require('./settings');
const http = require('http');
const https = require('https');
const httpClient = require('./httpclient');

const DEFAULTINSTANCE = 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab';
const GITHUBCHANGELOGURL = 'https://raw.githubusercontent.com/thkl/hap-homematic/NewUI/CHANGELOG.json';

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
        this.virtualKeys = []
        this.updateVersion = this.fetchVersion();
        this.fetchUpdate();
        setInterval(() => {
            this.fetchUpdate()
        }, 12 * 60 * 60 * 1000); // 2 times a day
    }

    init() {
        const self = this;
        Settings.setLogger(this.log);

        this.config = Settings.loadSettings();

        CCU.init(process.env.UIX_CCUHOST || '127.0.0.1', this.log);
        CCU.sidRequired = this.config.useCCCAuthentication;

        this.app = express();
        this.app.use(cors())
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());

        const staticFiles = path.join(__dirname, 'client');
        this.app.use('/', express.static(staticFiles));

        let routePath = path.join(__dirname, 'routes');
        fs.readdir(routePath, async (err, items) => {
            items.forEach((item) => {
                if (item.match(/.*_route.js/)) {
                    self.log.debug('processing route file %s', item)
                    self.app.use('/api', require(path.join(__dirname, 'routes', item))(this));
                }
            });
        });
        // Check if /usr/local/etc/config/httpsRedirectEnabled is available and we have to switch to https
        let forceTLS = fs.existsSync('/usr/local/etc/config/httpsRedirectEnabled')
        this.log.info('httpsRedirect exists %s', forceTLS)
        let keyFile = '/etc/config/server.pem'
        let certFile = '/etc/config/server.pem'
        if ((this.config.useTLS === true) || (forceTLS === true)) {
            CCU.useTLS();

            if ((fs.existsSync(keyFile)) && (fs.existsSync(certFile))) {
                // Just use Homematics TLS Certificate :o)
                this.log.info('Using https transport')
                const privateKey = fs.readFileSync(keyFile, 'utf8')
                const certificate = fs.readFileSync(certFile, 'utf8')
                CCU.useTLS(certificate);
                const credentials = { key: privateKey, cert: certificate }
                try {
                    this.server = this.createServer(credentials);

                } catch (e) {
                    this.server = this.createServer();
                }
            }
        }

        if (this.server === undefined) {
            this.server = this.createServer();
        }

        SocketManager.connect(this.log, this.server);
        SocketManager.getSystemInfo = async () => {
            return self.getSystemInfo();
        }

        SocketManager.on('hello', (event) => {
            let sysData = this.getSystemInfo()
            SocketManager.sendMessageToSocket(event.connection, { message: 'heartbeat', payload: sysData })
        })

        this.useAuth = this.config.useAuth || false
        this.useTLS = this.config.useTLS || false
        this.interfaceWatchdog = this.config.interfaceWatchdog || 300
        this.enableMonitoring = this.config.enableMonitoring || false
        this.disableHistory = this.config.disableHistory || false
        this.forceCache = this.config.forceCache || false
        this.forceRefresh = false
        if (this.useAuth === true) {
            this.log.info('sid will be required')
            CCU.sidRequired = true;
        }
        this.log.info('Config Start heartBeat')
        this.heartBeat()
        this.log.info('Config Server is running')
    }


    heartBeat() {
        let self = this
        if (SocketManager.hasConnections()) {
            let sysData = this.getSystemInfo()
            SocketManager.sendMessageToSockets({ message: 'heartbeat', payload: sysData })
        }
        setTimeout(() => {
            self.heartBeat()
        }, 180 * 1000)
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

    shutdown() {
        this.server.close()
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

    getProgramServiceList() {
        var result = []
        if ((this.services) && (this.services.PROGRAMM)) {
            this.services.PROGRAMM.map(item => {
                result.push(item)
            })
        }
        return result
    }


    getSystemInfo() {
        var result = {}
        result.cpu = os.cpus()
        result.mem = os.freemem()
        result.uptime = os.uptime()
        result.hapuptime = process.uptime()
        result.version = this.fetchVersion()
        result.update = this.updateVersion;

        const debugEnabled = this.log.isDebugEnabled();
        result.debug = ((debugEnabled === true) || (debugEnabled === 'true'))
        result.useAuth = this.useAuth
        result.useTLS = this.useTLS
        result.enableMonitoring = this.enableMonitoring
        result.disableHistory = this.disableHistory
        result.forceRefresh = this.forceRefresh
        result.forceCache = this.forceCache
        result.interfaceWatchdog = this.interfaceWatchdog

        const appl = this.getApplianceList().length;
        result.isEmpty = (appl === 0);
        this.forceRefresh = false
        return result
    }

    fetchVersion() {
        let packageFile = path.join(__dirname, '..', '..', 'package.json')
        this.log.debug('Check Version from %s', packageFile)
        if (fs.existsSync(packageFile)) {
            try {
                this.packageData = JSON.parse(fs.readFileSync(packageFile))
                this.log.debug('version is %s', this.packageData.version)
                return this.packageData.version
            } catch (e) {
                return 'no version found'
            }
        }
        return 'no version found'
    }

    fetchUpdate() {
        const self = this
        httpClient.getJSON(GITHUBCHANGELOGURL).then(res => {
            if ((res) && (res.latest)) {
                self.log.info('UpdateVersion is %s', res.latest);
                self.updateVersion = res.latest;
            }
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
            appliances: this.getApplianceList(),
            bridges: this.bridges,
            varTrigger: this.pluginVariableTrigger,
            createHelper: (this.autoUpdateVarTriggerHelper === true),
            ccuDevices: this.createCompatibleDeviceList()
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
                appl.instances = [];
                const instNames = [];
                if (typeof appl.settings.instance === 'object') {
                    appl.settings.instance.forEach(instID => {

                        if (typeof instID === 'object') {
                            instID = instID.id;
                        }

                        let instance = this.bridgeWithId(instID)
                        if (instance !== undefined) {
                            instNames.push({ id: instID, name: instance.displayName });
                        }
                    })
                } else {
                    let instance = this.bridgeWithId(appl.instanceID)
                    if (instance !== undefined) {
                        instNames.push({ id: appl.instanceID, name: instance.displayName });
                    }
                }
                appl.instances = instNames
            })
        }
        return aplList
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

    createCompatibleProgramsList() {
        if (this.compatiblePrograms) {
            return this.compatiblePrograms.filter(program => program.name.indexOf('${ruleTmpProgramName}') === -1) // filter tmp programs out
        } else {
            return [];
        }
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
            let config = Settings.loadSettings()
            if (config.mappings !== undefined) {
                Object.keys(config.mappings).map(deviceId => {
                    let device = config.mappings[deviceId]
                    if (device.instance === instanceObjectId) {
                        device.instance = 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab'
                    }
                })
            }
            delete config.instances[instanceObjectId]
            Settings.saveSettings(config)
            return true;
        }
        return false;
    }

    saveInstance(instanceObject) {
        this.log.debug('save Instance %s', JSON.stringify(instanceObject))
        let instanceUuid = instanceObject.id
        let bridge = this.bridgeWithId(instanceUuid)
        if (bridge === undefined) {
            this.log.debug('object %s not found create a new instance', instanceUuid);
            // Add a new one
            const name = instanceObject.displayName;
            const roomId = instanceObject.roomId;
            let configData = Settings.loadSettings()

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

                this.settingsManager.saveSettings(configData)
                newInstance.displayName = `HomeMatic ${name}`;
                newInstance.id = newUUID;
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
            this.log.debug('updating %s with %s', instanceUuid, name)
            // change the name in the config and reload everything
            let config = Settings.loadSettings()
            if ((config) && (config.instances)) {
                bridge.name = name;
                bridge.roomId = parseInt(roomId)
                bridge.publishDevices = publishDevices
                config.instances[instanceUuid] = bridge
                Settings.saveSettings(config)
                return bridge;
            }
        }
        return false;
    }

    getSupportData(address) {
        // first get the device file
        const deviceFile = path.join(process.env.UIX_CONFIG_PATH, 'devices.json')
        if (fs.existsSync(deviceFile)) {
            try {
                const objDev = JSON.parse(fs.readFileSync(deviceFile))
                let result = {}
                if ((objDev) && (objDev.devices)) {
                    objDev.devices.map(device => {
                        let id = 1000
                        // make it random
                        let digits = Math.floor(Math.random() * 9000000000) + 1000000000
                        let dummyAdr = digits.toString() + 'ABCD'
                        if (device.address === address) {
                            result.devices = []
                            const tmpD = {
                                id: id,
                                intf: 0,
                                intfName: '',
                                name: device.type,
                                address: dummyAdr,
                                type: device.type,
                                channels: []
                            }
                            id = id + 1
                            device.channels.map(channel => {
                                const chn = channel.address.split(':').slice(1, 2)[0]
                                const tmpC = {
                                    id: id,
                                    name: dummyAdr + ':' + chn,
                                    intf: 0,
                                    address: dummyAdr + ':' + chn,
                                    type: channel.type,
                                    access: channel.access
                                }
                                tmpD.channels.push(tmpC)
                                id = id + 1
                            })
                            result.devices.push(tmpD)
                        }
                    })
                    return result
                }
            } catch (e) {
                return 'error while creating the file ' + e.stack
            }
        }
        return 'devices.json not found'
    }

    saveDevice(data, configData, save) {
        const self = this
        return new Promise(async (resolve, reject) => {
            this.log.debug(data);
            let name = data.name
            let channel = data.address
            var isSpecial

            if (channel === 'new:special') {
                isSpecial = uuid.generate(`special_${name}_${String(Math.random())}`); // generate a random uuid
                channel = isSpecial + ':0'
                data.address = channel
                data.serial = isSpecial
            }

            let settings = ((data.settings) && (data.settings.settings)) ? data.settings.settings : {}
            let instanceList = []

            if (data.instances) {
                data.instances.forEach(inst => {
                    instanceList.push(inst.id);
                })
            }

            if (instanceList.length === 0) {
                instanceList.push(uuid.generate('0')) // add the default if there is no instance from the ui
            }

            let service = data.serviceClass
            if ((service === undefined) || (service === '')) {
                self.log.info('No Service from UI so we will use the default for %s', channel);
                const sList = this.serviceSettingsFor(channel);
                if ((sList) && (sList.service)) {
                    const firstService = sList.service.find(service => (service.priority === 0));
                    self.log.debug('default is %s', firstService);
                    service = firstService.serviceClazz
                } else {
                    self.log.error('Servicelist not found')
                    console.log(sList);
                }
            }
            if ((name) && (channel) && (service)) {

                if (configData === undefined) {
                    configData = Settings.loadSettings()
                }
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

                if (configData.programs === undefined) {
                    configData.programs = []
                }


                // remove settings which are not part of the class settings
                let clazzFile = path.join(__dirname, '..', 'services', service + '.js')
                if (fs.existsSync(clazzFile)) {
                    let oClazz = require(clazzFile)
                    let oClazzSettings = await oClazz.configurationItems()
                    Object.keys(settings).map((key) => {
                        if (Object.keys(oClazzSettings).indexOf(key) === -1) {
                            delete settings[key]
                            self.log.debug('removed %s which is not part of %s settings.', key, service)
                        }
                    })
                } else {
                    self.log.debug('clazzFile %s not found', clazzFile)
                }


                // Add the mapping
                configData.mappings[channel] = {
                    name: name,
                    Service: service,
                    instance: instanceList,
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
                        if (configData.programs.indexOf(data.nameInCCU) === -1) {
                            configData.programs.push(data.nameInCCU)
                        }
                        break
                    case 'HapSpecial':
                        // There is a Special Array so put this also in
                        if (configData.special.indexOf(data.serial) === -1) {
                            configData.special.push(data.serial)
                        }
                        break;
                }
                // Save the stuff
                if (save === true) {
                    Settings.saveSettings(configData)
                }

                resolve({ success: true, data })
            } else {
                self.log.error('Some stuff is missing Name %s, Channel %s, Service %s', name, channel, service);
                resolve({ success: false, data: null })
            }
        })
    }

    removeObject(address) {
        let configData = Settings.loadSettings()
        if ((configData.mappings) && (configData.mappings[address])) {
            this.log.debug('will remove device with address %s', address)

            if ((configData) && (configData.mappings)) {
                this.log.debug('remove mapping configuration')
                delete configData.mappings[address]
            }


            if ((configData) && (configData.channels)) {
                let index = configData.channels.indexOf(address)
                if (index > -1) {
                    this.log.debug('channel data found .. remove')
                    configData.channels.splice(index, 1)
                }
            }

            let split = address.split(':')[0];

            if ((configData) && (configData.variables)) {
                let index = configData.variables.indexOf(split)
                if (index > -1) {
                    this.log.debug('variable data found .. remove')
                    configData.variables.splice(index, 1)
                }
            }

            if ((configData) && (configData.programs)) {
                let index = configData.programs.indexOf(split)
                if (index > -1) {
                    this.log.debug('program data found .. remove')
                    configData.programs.splice(index, 1)
                }
            }

            // remove it from special if its there
            if ((configData) && (configData.special)) {
                // The Special Object does not have a channel so just use the split value
                let index = configData.special.indexOf(split)
                if (index > -1) {
                    this.log.debug('special entry found ... remove')
                    configData.special.splice(split, 1)
                }
            }

            Settings.saveSettings(configData)
            return true;
        } else {
            return false;
        }
    }

    toggleDebug(enable) {
        this.process.send(
            {
                topic: 'debug',
                debug: enable
            }
        )
    }

    commandReload() {
        this.process.send({
            topic: 'reloadApplicances',
            uuid: uuid
        })
    }
    // THIS IS DANGERous .. but well 
    resetSystem() {
        this.process.send({
            topic: 'resetSystem'
        })
        // Restart the system after 2 seconds
        this.restartSystem(2000);
    }

    restartSystem(delay = 500) {
        // get the update command and run it
        let packageFile = path.join(__dirname, '..', '..', 'package.json')
        if (fs.existsSync(packageFile)) {
            try {
                let packageData = JSON.parse(fs.readFileSync(packageFile))
                if ((packageData) && (packageData.scripts)) {
                    let restartScript = packageData.scripts.restart
                    this.log.debug('restart command will be %s called in 500ms', restartScript)
                    if (restartScript) {
                        const childprocess = require('child_process')
                        setTimeout(() => {
                            childprocess.execSync(restartScript)
                        }, delay)
                    }
                }
            } catch (e) {
                return { 'error': 'unable to get the restart command' }
            }
        }
    }

    refreshCache() {
        this.process.send({
            topic: 'refreshCache'
        })
    }

    getApplianceList() {
        let result = [];

        if (this.pluginAccessories) {
            this.pluginAccessories.forEach(element => {
                // Make sure we have only one of each object the server will send more than one copy if one device is on multiple instances
                if (result.find(item => (item.UUID === element.UUID)) === undefined) {
                    result.push(Object.assign({}, element, { applianceType: 'HapDevice' }));
                }
            });
        }

        if (this.pluginPrograms) {
            this.pluginPrograms.forEach(element => {
                if (result.find(item => (item.UUID === element.UUID)) === undefined) {
                    result.push(Object.assign({}, element, { applianceType: 'HapProgram' }));
                }
            });
        }

        if (this.pluginVariables) {
            this.pluginVariables.forEach(element => {
                if (result.find(item => (item.UUID === element.UUID)) === undefined) {
                    result.push(Object.assign({}, element, { applianceType: 'HapVariable' }));
                }
            });
        }

        if (this.pluginSpecial) {
            this.pluginSpecial.forEach(element => {
                if (result.find(item => (item.UUID === element.UUID)) === undefined) {
                    result.push(Object.assign({}, element, { applianceType: 'HapSpecial' }));
                }
            });
        }
        return result;
    }


    saveVariableTrigger(datapoint, autoUpdateVarTriggerHelper) {
        if (datapoint) {
            let configData = Settings.loadSettings()
            configData.VariableUpdateEvent = datapoint
            configData.autoUpdateVarTriggerHelper = ((autoUpdateVarTriggerHelper === true) || (autoUpdateVarTriggerHelper === 'true'))
            Settings.saveSettings(configData)
            this.process.send({
                topic: 'reloadApplicances',
                uuid: uuid
            })
            return true
        } else {
            return false
        }
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
                SocketManager.sendMessageToSockets({ message: 'instances', payload: this.bridges });
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
                    this.autoUpdateVarTriggerHelper = (message.autoUpdateVarTriggerHelper === true)
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

            case 'virtualKeys':
                this.virtualKeys = message.virtualKeys
                break


            case 'compatibleObjects':
                this.compatibleDevices = message.devices
                this.allVariables = message.variables
                this.compatiblePrograms = message.programs
                this.sendObjects();
                break

            case 'debug':
                this.log.debug('New System Debug Message : %s', message.debug)
                this.log.setDebugEnabled(message.debug)
                break
        }
    }
}
