const path = require('path')
const fs = require('fs')
const Rega = require(path.join(__dirname, 'HomeMaticRegaRequest.js'))
const HomeMaticRPC = require(path.join(__dirname, 'HomeMaticRPC.js'))
const url = require('url')

class HomeMaticCCU {
  constructor (log, configuration) {
    this.log = log
    this.log.debug('[CCU] init CCU Connections')
    this.interfaces = {}
    this.sectionChannelIds = []
    this.cachedValues = {}
    this.eventCallbacks = {}
    this.configuration = configuration
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

  variableWithName (varName) {
    var result
    this.getVariables().map(variable => {
      if (variable.name === varName) {
        result = variable
      }
    })
    return result
  }

  loadDeviceDatabase (databasePath) {
    let self = this
    this.log.info('[CCU] loading device database from %s', databasePath)
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(databasePath)) {
        self.log.error('[CCU] device database not found get a new one')
        self.updateDeviceDatabase(databasePath).then(() => {
          resolve()
        })
      } else {
        let oDb = JSON.parse(fs.readFileSync(databasePath))
        if (oDb) {
          self.devices = oDb.devices
          self.log.info('[CCU] device database loaded %s devices found', self.devices.length)
          resolve()
        } else {
          self.log.error('[CCU] unable to load device database will get a new one')
          self.updateDeviceDatabase(databasePath).then(() => {
            resolve()
          })
        }
      }
    })
  }

  loadVariableDatabase (databasePath) {
    let self = this
    this.log.info('[CCU] loading variable database from %s', databasePath)
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(databasePath)) {
        self.log.error('[CCU] variable database not found get a new one')
        self.updateVariableDatabase(databasePath).then(() => {
          resolve()
        })
      } else {
        let oDb = JSON.parse(fs.readFileSync(databasePath))
        if (oDb) {
          self.variables = oDb.variables
          self.log.info('[CCU] variable database loaded %s devices found', self.variables.length)
          resolve()
        } else {
          self.log.error('[CCU] unable to load variable database will get a new one')
          self.updateVariableDatabase(databasePath).then(() => {
            resolve()
          })
        }
      }
    })
  }

  loadProgramDatabase (databasePath) {
    let self = this
    this.log.info('[CCU] loading program database from %s', databasePath)
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(databasePath)) {
        self.log.error('[CCU] variable program not found get a new one')
        self.updateProgramDatabase(databasePath).then(() => {
          resolve()
        })
      } else {
        let oDb = JSON.parse(fs.readFileSync(databasePath))
        if (oDb) {
          self.programs = oDb.programs
          self.log.info('[CCU] program database loaded %s devices found', self.programs.length)
          resolve()
        } else {
          self.log.error('[CCU] unable to load program database will get a new one')
          self.updateProgramDatabase(databasePath).then(() => {
            resolve()
          })
        }
      }
    })
  }

  updateDeviceDatabase (databasePath) {
    let self = this
    return new Promise((resolve, reject) => {
      self.fetchAllDevices().then(oDev => {
        self.devices = oDev.devices
        fs.writeFile(databasePath, JSON.stringify(oDev, ' ', 2), () => {
          resolve()
        })
      })
    })
  }

  updateVariableDatabase (databasePath) {
    let self = this
    return new Promise((resolve, reject) => {
      self.fetchVariables().then(oVar => {
        self.variables = oVar.variables
        fs.writeFile(databasePath, JSON.stringify(oVar, ' ', 2), () => {
          resolve()
        })
      })
    })
  }

  updateProgramDatabase (databasePath) {
    let self = this
    return new Promise((resolve, reject) => {
      self.fetchPrograms().then(oVar => {
        self.programs = oVar.programs
        fs.writeFile(databasePath, JSON.stringify(oVar, ' ', 2), () => {
          resolve()
        })
      })
    })
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

      let rega = new Rega(self.log)
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

      let rega = new Rega(self.log)
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

      let rega = new Rega(self.log)
      rega.script(script).then(programs => {
        let oPrograms = JSON.parse(programs)
        resolve(oPrograms)
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
      script = script + self._scriptPartForElement('address', 'oCh.Address()', 'string')
      script = script + 'Write(\'}\');} Write(\']}\');'

      let rega = new Rega(self.log)
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

  setValue (address, newValue) {
    let self = this
    return new Promise((resolve, reject) => {
      let script = 'object o = dom.GetObject(\'' + address + '\');if (o){'
      if (typeof newValue === 'string') {
        script = script + 'o.State(\'' + newValue + '\');}'
      } else {
        script = script + 'o.State(' + newValue + ');}'
      }
      let rega = new Rega(self.log)
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
        let script = 'object o = dom.GetObject(\'' + address + '\');if (o){Write(o.State());}'
        let rega = new Rega(self.log)
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
      let rega = new Rega(self.log)
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
      let rega = new Rega(self.log)
      rega.script(script).then((regaResult) => {
        resolve(regaResult)
      })
    })
  }

  runProgram (programName) {
    let self = this
    return new Promise((resolve, reject) => {
      let script = 'object o = dom.GetObject(ID_PROGRAMS).Get(\'' + programName + '\');if (o){Write(o.ProgramExecute());}'
      let rega = new Rega(self.log)
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

  prepareInterfaces () {
    let self = this
    self.log.debug('[CCU] creating eventserver ')
    // create an rpc server if not in use yet
    if (!this.rpc) {
      this.rpc = new HomeMaticRPC(this, 9875)
      this.rpc.init()
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
    this.rpc.connect()
    this.rpc.on('event', (event) => {
      self.setCache(event.address, event.value)
      let evc = self.eventCallbacks[event.address]

      if (evc) {
        evc(event.value)
      }
    })
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
      let rega = new Rega(self.log)
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
      let rega = new Rega(self.log)
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
    if (type === 'string') {
      return 'Write(\'"' + elementName + '": "\' # ' + functionName + ' # \'"' + leadingComa + '\');'
    } else {
      return 'Write(\'"' + elementName + '": \' # ' + functionName + ' # \'' + leadingComa + '\');'
    }
  }
}

module.exports = HomeMaticCCU
