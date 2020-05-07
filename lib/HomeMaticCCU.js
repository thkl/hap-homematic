const path = require('path')
const fs = require('fs')
const Rega = require(path.join(__dirname, 'HomeMaticRegaRequest.js'))
const HomeMaticRPC = require(path.join(__dirname, 'HomeMaticRPC.js'))
const url = require('url')
const EventEmitter = require('events')
const http = require('http')

class HomeMaticCCU extends EventEmitter {
  constructor (log, configuration) {
    super()
    this.log = log
    this.log.debug('[CCU] init CCU Connections')
    this.interfaces = {}
    this.sectionChannelIds = []
    this.cachedValues = {}
    this.eventCallbacks = {}
    this.configuration = configuration
    this.ccuIP = configuration.ccuIP || '127.0.0.1'
  }

  init () {

  }

  connect () {
    let self = this
    this.eventCallbacks = {}
    return new Promise((resolve, reject) => {
      self._fetchInterfaces().then(o => {
        resolve()
      })
    })
  }

  async pingRega () {
    this.log.info('[CCU] check Rega is alive')
    return new Promise((resolve, reject) => {
      let rega = new Rega(this.log, this.ccuIP)
      rega.script('Write("Pong");').then(result => {
        resolve(result === 'Pong')
      })
    })
  }

  getChannelByAddress (chAddress) {
    var result
    let dl = this.getCCUDevices()
    for (var di = 0; di < dl.length; di++) {
      var device = dl[di]
      if ((device.address) && (device.address.length > 1) && (chAddress.indexOf(device.address) > -1)) {
        for (var ci = 0; ci < device.channels.length; ci++) {
          var channel = device.channels[ci]
          if (channel.address === chAddress) {
            channel.dtype = device.type
            channel.dname = device.name
            result = channel

            break
          }
        }
      }
    }
    if (result === undefined) {
      this.log.error('[CCU] no channel found for %s', chAddress)
    }
    return result
  }

  getCCUDevices () {
    return this.devices || []
  }

  getVariables () {
    return this.variables || []
  }

  getPrograms () {
    return this.programs || []
  }

  getRooms () {
    return this.rooms || []
  }

  variableWithName (varName) {
    var result
    this.getVariables().map(variable => {
      if (variable.name === varName) {
        result = variable
      }
    })
    return result
  }

  async loadDatabases (configurationPath, dryRun = false) {
    let self = this
    this.configurationPath = configurationPath

    this.log.debug('[CCU] loading databases')
    this.devices = await this.loadObjectDatabase(path.join(configurationPath, 'devices.json'), 'devices', dryRun, async () => {
      let result = await self.fetchAllDevices()
      return result
    })
    this.log.info('[CCU] device database loaded %s devices found', this.devices.length)

    this.variables = await this.loadObjectDatabase(path.join(configurationPath, 'variables.json'), 'variables', dryRun, async () => {
      let result = await self.fetchVariables()
      return result
    })
    this.log.info('[CCU] variable database loaded %s variables found', this.variables.length)

    this.programs = await this.loadObjectDatabase(path.join(configurationPath, 'programs.json'), 'programs', dryRun, async () => {
      let result = await self.fetchPrograms()
      return result
    })
    this.log.info('[CCU] program database loaded %s programs found', this.programs.length)

    this.rooms = await this.loadObjectDatabase(path.join(configurationPath, 'rooms.json'), 'rooms', dryRun, async () => {
      let result = await self.fetchRooms()
      return result
    })
    this.log.info('[CCU] room database loaded %s rooms found', this.rooms.length)
  }

  loadObjectDatabase (databasePath, type, dryRun, fetchFunction) {
    let self = this
    this.log.info('[CCU] loading object database for %s from %s', type, databasePath)
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(databasePath)) {
        if (!dryRun) {
          self.log.error('[CCU] databse not found get a new one')
          self.updateObjectDatabase(databasePath, fetchFunction).then((result) => {
            resolve(result[type])
          })
        } else {
          self.log.warn('[CCU] test mode do not fetch anything')
          resolve(undefined)
        }
      } else {
        var oDb
        try {
          oDb = JSON.parse(fs.readFileSync(databasePath))
        } catch (e) {
          self.log.warn('[CCU] unable to parse cached database.')
        }

        if (oDb) {
          let result = oDb[type]
          self.log.info('[CCU] object database loaded %s objects found', result.length)
          resolve(result)
        } else {
          if (!dryRun) {
            self.log.error('[CCU] unable to load object database will get a new one')
            self.updateObjectDatabase(databasePath, fetchFunction).then((result) => {
              resolve(result[type])
            })
          } else {
            self.log.warn('[CCU] test mode do not fetch anything')
            resolve(undefined)
          }
        }
      }
    })
  }

  updateObjectDatabase (databasePath, fetchFunction) {
    return new Promise((resolve, reject) => {
      fetchFunction().then(oResult => {
        fs.writeFile(databasePath, JSON.stringify(oResult, ' ', 2), () => {
          resolve(oResult)
        })
      })
    })
  }

  async updateDeviceDatabase () {
    if ((this.deviceDBUpdateRunning) || (this.dryRun)) {
      this.log.debug('[CCU] updateDeviceDatabase is running skip other call')
      return
    }
    let self = this
    this.deviceDBUpdateRunning = true
    var result = await this.updateObjectDatabase(path.join(this.configurationPath, 'devices.json'), async () => {
      let result = await self.fetchAllDevices()
      return result
    })
    this.devices = result.devices
    this.emit('devicelistchanged', null)
    this.deviceDBUpdateRunning = false
  }

  async updateDatabases (databasePath) {
    let self = this
    var result

    result = await this.updateObjectDatabase(path.join(databasePath, 'variables.json'), async () => {
      let result = await self.fetchVariables()
      return result
    })
    this.variables = result.variables

    result = await this.updateObjectDatabase(path.join(databasePath, 'programs.json'), async () => {
      let result = await self.fetchPrograms()
      return result
    })
    this.programs = result.programs

    result = await this.updateObjectDatabase(path.join(databasePath, 'rooms.json'), async () => {
      let result = await self.fetchRooms()
      return result
    })
    this.rooms = result.rooms
  }

  async shutdown () {
    this.log.debug('[CCU] shutdown')
    await this.disconnectInterfaces()
    this.log.debug('[CCU] shutdown completed')
  }

  async disconnectInterfaces () {
    return new Promise(async (resolve, reject) => {
      if (this.rpc) {
        await this.rpc.disconnectInterfaces()
        this.rpc.resetInterfaces()
        this.rpc.removeAllListeners('event')
      }
      resolve()
    })
  }

  fetchAllDevices () {
    let self = this
    return new Promise((resolve, reject) => {
      this.eventaddresses = []
      var script = 'string sDeviceId;string sChannelId;boolean df = true;Write(\'{"devices":[\');foreach(sDeviceId, root.Devices().EnumIDs()){object oDevice = dom.GetObject(sDeviceId);if(oDevice){if(df) {df = false;} else { Write(\',\');}Write(\'{\');'

      script = script + self._scriptPartForElement('id', 'sDeviceId', 'number', ',')
      script = script + self._scriptPartForElement('name', 'oDevice.Name()', 'string', ',')
      script = script + self._scriptPartForElement('address', 'oDevice.Address()', 'string', ',')
      script = script + self._scriptPartForElement('type', 'oDevice.HssType()', 'string', ',')
      script = script + 'Write(\'"channels": [\');boolean bcf = true;foreach(sChannelId, oDevice.Channels().EnumIDs()){object oChannel = dom.GetObject(sChannelId);'
      script = script + 'if(bcf) {bcf = false;} else {Write(\',\');}Write(\'{\');'
      script = script + self._scriptPartForElement('id', 'sChannelId', 'number', ',')
      script = script + self._scriptPartForElement('name', 'oChannel.Name()', 'string', ',')
      script = script + self._scriptPartForElement('intf', 'oDevice.Interface()', 'number', ',')
      script = script + self._scriptPartForElement('address', 'oChannel.Address()', 'string', ',')
      script = script + self._scriptPartForElement('type', 'oChannel.HssType()', 'string', ',')
      script = script + self._scriptPartForElement('access', 'oChannel.UserAccessRights(iulOtherThanAdmin)', 'number')
      script = script + 'Write(\'}\');}Write(\']}\');}}Write(\']\');'
      script += 'var s = dom.GetObject("'
      script += this.subsection
      script += '");string cid;boolean sdf = true;if (s) {Write(\',"subsection":[\');foreach(cid, s.EnumUsedIDs()){ '
      script += ' if(sdf) {sdf = false;}'
      script += ' else { Write(\',\');}Write(cid);}Write(\']\');}'

      script += 'Write(\'}\');'

      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then(devices => {
        let oDevices = JSON.parse(devices)
        resolve(oDevices)
      })
    })
  }

  fetchVariables () {
    let self = this
    return new Promise((resolve, reject) => {
      var script = 'string varid;boolean df = true;Write(\'{"variables":[\');foreach(varid, dom.GetObject(ID_SYSTEM_VARIABLES).EnumIDs()){object ovar = dom.GetObject(varid);if(df) {df = false;} else { Write(\',\');}Write(\'{\')'
      script = script + self._scriptPartForElement('id', 'varid', 'number', ',')
      script = script + self._scriptPartForElement('name', 'ovar.Name()', 'string', ',')
      script = script + self._scriptPartForElement('dpInfo', 'ovar.DPInfo()', 'string', ',')
      script = script + self._scriptPartForElement('unerasable', 'ovar.Unerasable()', 'string', ',')
      script = script + self._scriptPartForElement('valuetype', 'ovar.ValueType()', 'number', ',')
      script = script + self._scriptPartForElement('subtype', 'ovar.ValueSubType()', 'number', ',')
      script = script + self._scriptPartForElement('minvalue', 'ovar.ValueMin()', 'string', ',')
      script = script + self._scriptPartForElement('maxvalue', 'ovar.ValueMax()', 'string', ',')
      script = script + self._scriptPartForElement('unit', 'ovar.ValueUnit()', 'string', '')

      script = script + 'Write(\'}\');} Write(\']}\');'

      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then(variables => {
        let oVariables = JSON.parse(variables)
        resolve(oVariables)
      })
    })
  }

  fetchPrograms () {
    let self = this
    return new Promise((resolve, reject) => {
      var script = 'string prgid;boolean df = true;Write(\'{"programs":[\');foreach(prgid, dom.GetObject(ID_PROGRAMS).EnumIDs()){object oprg = dom.GetObject(prgid);if(df) {df = false;} else { Write(\',\');}Write(\'{\')'
      script = script + self._scriptPartForElement('id', 'prgid', 'number', ',')
      script = script + self._scriptPartForElement('name', 'oprg.Name()', 'string', ',')
      script = script + self._scriptPartForElement('dpInfo', 'oprg.PrgInfo()', 'string', '')
      script = script + 'Write(\'}\');} Write(\']}\');'

      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then(programs => {
        let oPrograms = JSON.parse(programs)
        resolve(oPrograms)
      })
    })
  }

  fetchRooms () {
    let self = this
    return new Promise((resolve, reject) => {
      var script = 'string rid;boolean df = true;Write(\'{"rooms":[\');foreach(rid, dom.GetObject(ID_ROOMS).EnumIDs()){object oRoom = dom.GetObject(rid);if(df) {df = false;} else { Write(\',\');}Write(\'{\')'
      script = script + self._scriptPartForElement('id', 'rid', 'number', ',')
      script = script + self._scriptPartForElement('name', 'oRoom.Name()', 'string', ',')
      script = script + self._scriptPartForElement('channels', 'oRoom.EnumUsedIDs()', 'enumeration', '')
      script = script + 'Write(\'}\');} Write(\']}\');'

      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then(strRooms => {
        let oRooms = JSON.parse(strRooms)
        resolve(oRooms)
      })
    })
  }

  fetchDevices () {
    let self = this
    return new Promise((resolve, reject) => {
    // first build a \t string from channel IDs
      let cList = this.sectionChannelIds.join('\t')
      var script = 'string cid;boolean df=true;'
      script = script + 'string list = \'' + cList + '\';'
      script = script + 'Write(\'{"channels":[\');foreach(cid, list){object oCh = dom.GetObject(cid);var did = oCh.Device(); if (did) {object oDe = dom.GetObject(did);} if(df) {df = false;} else { Write(\',\');}Write(\'{\')'
      script = script + self._scriptPartForElement('id', 'cid', 'number', ',')
      script = script + self._scriptPartForElement('name', 'oCh.Name()', 'string', ',')
      script = script + self._scriptPartForElement('type', 'oCh.HssType()', 'string', ',')
      script = script + self._scriptPartForElement('intf', 'oCh.Interface()', 'number', ',')
      script = script + self._scriptPartForElement('dtype', 'oDe.HssType()', 'string', ',')
      script = script + self._scriptPartForElement('dname', 'oDe.Name()', 'string', ',')
      script = script + self._scriptPartForElement('address', 'oCh.Address()', 'string', ',')
      script = script + self._scriptPartForElement('access', 'oChannel.UserAccessRights(iulOtherThanAdmin)', 'number', '')
      script = script + 'Write(\'}\');} Write(\']}\');'

      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then(channels => {
        if (channels) {
          let oChannels = JSON.parse(channels)
          self.channels = oChannels.channels
          resolve(self.channels)
        } else {
          reject(new Error('unable to fetch devices'))
        }
      })
    })
  }

  /*

var script = 'Write("["");var i=dom.GetObject(41);if(i.State()>0){var s=dom.GetObject(ID_SERVICES);string sid;foreach(sid,s.EnumIDs()){var o=dom.GetObject(sid);if (o.AlState()==asOncoming){'
script = script + 'Write(o.ID()#'\\t'#o.Name()#'\\t'#o.Timestamp());}}}'
script = script + 'Write("]");

*/

  hazDatapoint (dpName) {
    let self = this
    if (typeof dpName === 'object') {
      dpName = dpName.address()
    }
    return new Promise((resolve, reject) => {
      let script = 'Write(\'{"result":\');var x = dom.GetObject("' + dpName + '");if (x) {Write("true");}else{Write("false");}Write("}");'
      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then(data => {
        resolve(data.result)
      })
    })
  }

  setValue (address, newValue) {
    let self = this
    return new Promise((resolve, reject) => {
      let script = 'object o = dom.GetObject(\'' + address + '\');if (o){'
      if (typeof newValue === 'string') {
        script = script + 'o.State(\'' + newValue + '\');}'
      } else {
        script = script + 'o.State(' + newValue + ');}'
      }
      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then((r) => {
        resolve(r)
      })
    })
  }

  getValue (address, ignoreCache = false) {
    var result
    let self = this
    return new Promise((resolve, reject) => {
      if (ignoreCache === false) {
        result = this.getCache(address)
      }
      if (result === undefined) {
        self.log.debug('[CCU] ask Rega %s', address)
        let script = 'object o = dom.GetObject(\'' + address + '\');if (o){Write(o.Value());}'
        let rega = new Rega(self.log, self.ccuIP)
        rega.script(script).then((regaResult) => {
          self.setCache(address, regaResult)
          self.fireEvent(address, regaResult)
          resolve(regaResult)
        })
      } else {
        self.log.debug('[CCU] %s return cached value %s', address, result)
        resolve(result)
      }
    })
  }

  getVariableValue (variable) {
    let self = this
    return new Promise((resolve, reject) => {
      let script = 'object o = dom.GetObject(ID_SYSTEM_VARIABLES).Get(\'' + variable + '\');if (o){Write(o.State());}'
      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then((regaResult) => {
        self.fireEvent(variable, regaResult)
        resolve(regaResult)
      })
    })
  }

  setVariable (variable, value) {
    let self = this
    return new Promise((resolve, reject) => {
      let script = 'object o = dom.GetObject(ID_SYSTEM_VARIABLES).Get(\'' + variable + '\');if (o){Write(o.State(' + value + '));}'
      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then((regaResult) => {
        resolve(regaResult)
      })
    })
  }

  runProgram (programName) {
    let self = this
    return new Promise((resolve, reject) => {
      let script = 'object o = dom.GetObject(ID_PROGRAMS).Get(\'' + programName + '\');if (o){Write(o.ProgramExecute());}'
      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then((regaResult) => {
        resolve(regaResult)
      })
    })
  }

  setCache (address, newValue) {
    this.cachedValues[address] = newValue
  }

  removeCache (address) {
    this.cachedValues[address] = undefined
  }

  getCache (address) {
    return this.cachedValues[address]
  }

  getInterfaceWithID (interfaceId) {
    return this.interfaces[interfaceId]
  }

  processMonitoring () { // if we are in debug remove the monitor
    if (this.log.isDebugEnabled()) {
      this.log.info('[CCU] skip Monitoring as we are in debug')
      this._removemonitconfig()
      this.log.info('[CCU] monit config removed')
    } else {
      if ((this.configuration) && (this.configuration.enableMonitoring === true)) {
        this.log.info('[CCU] enable Monitoring')
        this._buildmonitconfig()
      } else {
        this.log.info('[CCU] disable Monitoring')
        this._removemonitconfig()
      }
    }
  }

  prepareInterfaces () {
    let self = this
    self.log.debug('[CCU] creating eventserver ')
    // create an rpc server if not in use yet
    if (!this.rpc) {
      this.rpc = new HomeMaticRPC(this, 9875)
      this.rpc.init()
      this.processMonitoring()
    }
    Object.keys(this.interfaces).map(ifId => {
      let oInteface = self.interfaces[ifId]
      if (oInteface.inUse === true) {
        let iUrl = oInteface.url.replace('xmlrpc://', 'http://').replace('xmlrpc_bin://', 'http://')
        let oUrl = url.parse(iUrl)
        self.log.debug('[CCU] adding interface %s', oInteface.name)
        self.rpc.addInterface(oInteface.name, oUrl.hostname, oUrl.port, oUrl.pathname)
      }
    })
    this.rpc.on('event', (event) => {
      self.setCache(event.address, event.value)
      let evc = self.eventCallbacks[event.address]

      if (evc) {
        evc(event.value)
      }
    })

    this.rpc.on('newDevices', () => {
      if (!self.dryRun) {
        self.log.debug('[CCU] refresh device database on newDevices message from ccu')
        self.updateDeviceDatabase()
      }
    })
    this.rpc.connect()
  }

  fireEvent (address, value) {
    let cb = this.eventCallbacks[address]
    if (cb) {
      cb(value)
    }
  }

  registerAddressForEventProcessingAtAccessory (address, callback) {
    this.log.debug('[CCU] register address %s for events', address)
    this.eventCallbacks[address] = callback
    // also do a remote fetch for this address
    this.getValue(address, true)
  }

  _fetchHomeKitSubSectionIDs (subsection) {
    let self = this
    return new Promise((resolve, reject) => {
      var script = 'Write(\'{"subsection":[\');var s = dom.GetObject(ID_FUNCTIONS).Get("'
      script += subsection
      script += '");string cid;boolean sdf = true;if (s) {foreach(cid, s.EnumUsedIDs()){ '
      script += ' if(sdf) {sdf = false;}'
      script += ' else { Write(\',\');} Write(cid);}'
      script += '} Write(\']}\');'
      let rega = new Rega(self.log, self.ccuIP)
      rega.script(script).then(section => {
        if (section) {
          let oSection = JSON.parse(section)
          self.sectionChannelIds = oSection.subsection
          resolve()
        } else {
          reject(new Error('unable to fetch section'))
        }
      })
    })
  }

  _fetchInterfaces () {
    let self = this
    return new Promise((resolve, reject) => {
      let rega = new Rega(self.log, self.ccuIP)
      var script = 'string sifId;boolean df = true;Write(\'{"interfaces":[\');foreach(sifId, root.Interfaces().EnumIDs()){object oIf = dom.GetObject(sifId);if(df) {df = false;} else { Write(\',\');}Write(\'{\')'
      script = script + self._scriptPartForElement('id', 'sifId', 'number', ',')
      script = script + self._scriptPartForElement('name', 'oIf.Name()', 'string', ',')
      script = script + self._scriptPartForElement('type', 'oIf.Type()', 'string', ',')
      script = script + self._scriptPartForElement('typename', 'oIf.TypeName()', 'string', ',')
      script = script + self._scriptPartForElement('info', 'oIf.InterfaceInfo()', 'string', ',')
      script = script + self._scriptPartForElement('url', 'oIf.InterfaceUrl()', 'string')
      script = script + 'Write(\'}\');} Write(\']}\');'

      rega.script(script).then(strInterfaces => {
        if (strInterfaces) {
          let interfaces = JSON.parse(strInterfaces)
          interfaces.interfaces.map(oInterface => {
            self.interfaces[oInterface.id] = oInterface
          })
          resolve()
        } else {
          reject(new Error('unable to fetch Interfaces'))
        }
      })
    })
  }

  _scriptPartForElement (elementName, functionName, type, leadingComa = '') {
    var result
    if (type === 'string') {
      return 'Write(\'"' + elementName + '": "\' # ' + functionName + ' # \'"' + leadingComa + '\');'
    } else if (type === 'number') {
      return 'Write(\'"' + elementName + '": \' # ' + functionName + ' # \'' + leadingComa + '\');'
    } else if (type === 'stringenumeration') {
      result = 'Write(\'"' + elementName + '": [\');'
      result = result + 'string idf;boolean tf = true;foreach(idf,' + functionName + '){if(tf){tf=false;} else { Write(\',\');}'
      result = result + 'Write(\'"\' # idf # \'"\');}'
      result = result + 'Write(\']\');'
      return result
    } else if (type === 'enumeration') {
      result = 'Write(\'"' + elementName + '": [\');'
      result = result + 'string idf;boolean tf = true;foreach(idf,' + functionName + '){if(tf){tf=false;} else { Write(\',\');}'
      result = result + 'Write(\'\' # idf # \'\');}'
      result = result + 'Write(\']\');'
      return result
    }
  }

  _loadTranslations (lang) {
    this.translations = {}
    let self = this
    return new Promise((resolve, reject) => {
      let url = 'http://' + this.ccuIP + '/webui/js/lang/' + lang + '/translate.lang.extension.js'
      http.get(url, (res) => {
        const { statusCode } = res
        if (statusCode === 200) {

        }
        let rawData = ''
        res.on('data', (chunk) => { rawData += chunk })
        res.on('end', () => {
          try {
            const lines = rawData.split('\n')
            lines.forEach(line => {
              const match = line.match(/\s*"((func|room|sysVar)[^"]+)"\s*:\s*"([^"]+)"/)
              if (match) {
                let key = match[1]
                let trns = unescape(match[3])
                self.translations[key] = trns
              }
            })
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    })
  }

  _removemonitconfig () {
    if ((fs.existsSync('/usr/bin/monit')) && (fs.existsSync('/usr/local/etc/monit_hap-homematic.cfg'))) {
      try {
        fs.unlinkSync('/usr/local/etc/monit_hap-homematic.cfg')
        const childprocess = require('child_process')
        childprocess.execSync('/usr/bin/monit reload')
      } catch (e) {
        this.log.error(e)
      }
    }
  }

  _buildmonitconfig () {
    // first check if /usr/bin/monit is there and check if we have a pid file
    if (fs.existsSync('/usr/bin/monit')) {
      if (fs.existsSync('/var/run/hap-homematic.pid')) {
        let cfgFile = '/usr/local/etc/monit_hap-homematic.cfg'
        if (!fs.existsSync(cfgFile)) {
          try {
            this.log.info('[CCU] ok looks like we have a monitoring daemon so i will create settings for this')
            var config = '# Hap-HomeMatic Homekit engine daemon monitoring\n'
            config = config + 'check process HapHomeMatic with pidfile /var/run/hap-homematic.pid\n'
            config = config + '    group addons\n'
            config = config + '    start = "/etc/config/rc.d/hap-homematic start"\n'
            config = config + '    stop = "/etc/config/rc.d/hap-homematic stop"\n'
            config = config + '    restart = "/etc/config/rc.d/hap-homematic restart"\n'
            config = config + '    if not exist for 5 cycles then restart\n'
            config = config + '    if failed host \'127.0.0.1\' port 9875 protocol http request "/" for 5 cycles then restart\n'
            config = config + '    if 1 restart within 1 cycles then\n'
            config = config + '      exec "/bin/triggerAlarm.tcl \'Hap-HomeMatic restarted\' WatchDog-Alarm"\n'
            fs.writeFileSync(cfgFile, config)
            // reload the monitor daemon
            const childprocess = require('child_process')
            childprocess.execSync('/usr/bin/monit reload')
          } catch (e) {
            this.log.error(e)
          }
        }
      } else {
        this._removemonitconfig() // remove the monitor config if there is no pid file so we do not get reloaded by the monitor
      }
    }
  }
}

module.exports = HomeMaticCCU
