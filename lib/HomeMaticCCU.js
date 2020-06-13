/*
 * File: HomeMaticCCU.js
 * Project: hap-homematic
 * File Created: Saturday, 7th March 2020 2:20:39 pm
 * Author: Thomas Kluge (th.kluge@me.com)
 * -----
 * The MIT License (MIT)
 *
 * Copyright (c) Thomas Kluge <th.kluge@me.com> (https://github.com/thkl)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ==========================================================================
 */

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
        var hdp = false
        try {
          let obj = JSON.parse(data)
          if ((obj) && (obj.result === true)) {
            hdp = true
          }
        } catch (e) {

        }
        self.log.debug('[CCU] check HazDP %s result is %s', dpName, hdp)
        resolve(hdp)
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

  getInterfaceWithName (interfaceName) {
    var result
    let self = this
    Object.keys(this.interfaces).map(ifId => {
      let oInteface = self.interfaces[ifId]
      if (oInteface.name === interfaceName) {
        result = oInteface
      }
    })
    return result
  }

  sendInterfaceCommand (interfaceId, command, parameters) {
    if (this.rpc) {
      this.log.debug('[CCU] sendInterfaceCommand %s %s', interfaceId, command)
      return this.rpc.sendInterfaceCommand(interfaceId, command, parameters)
    }
  }

  async updateCCUVarTrigger (varList, triggerDataPoint) {
    let self = this
    this.log.debug('[CCU] updateCCUVarTrigger get datapoint and channel ids %s', triggerDataPoint)
    var getIDMessage = 'object x = dom.GetObject(\'' + triggerDataPoint + '\');Write(\'{"DpId":\' # x.ID() # \',\');Write(\'"ChId":\' # x.Channel() # \'}\');'
    let rega = new Rega(this.log, this.ccuIP)
    let getResult = await rega.script(getIDMessage)
    if (getResult) {
      try {
        let ids = JSON.parse(getResult)
        let channelID = ids.ChId
        let channelDpId = ids.DpId
        let tmpProg = '_hap_autotrigger_'
        // Core Block
        var regaMessage = 'object oPTmp = dom.GetObject( ID_PROGRAMS );'
        regaMessage = regaMessage + 'object program = dom.GetObject("' + tmpProg + '");'
        regaMessage = regaMessage + 'if (program) {'
        regaMessage = regaMessage + ' dom.DeleteObject(program);'
        regaMessage = regaMessage + '}'
        regaMessage = regaMessage + 'program = dom.CreateObject(OT_PROGRAM);'
        regaMessage = regaMessage + 'program.PrgInfo("This program will autotrigger the variable updater for hap-homematic.");'
        regaMessage = regaMessage + 'program.Name("' + tmpProg + '");'
        regaMessage = regaMessage + 'boolean bF1 = oPTmp.Add(program.ID());'
        regaMessage = regaMessage + 'object rule = program.Rule();'
        regaMessage = regaMessage + 'object destn = rule.RuleDestination();'
        regaMessage = regaMessage + 'object n_condition;'
        regaMessage = regaMessage + 'if (rule.RuleConditions().Count()>0) {'
        regaMessage = regaMessage + 'n_condition = rule.RuleConditions(0);'
        regaMessage = regaMessage + '} else {'
        regaMessage = regaMessage + 'n_condition = rule.RuleAddCondition();'
        regaMessage = regaMessage + '}'
        regaMessage = regaMessage + 'n_condition.CndOperatorType(2);'
        regaMessage = regaMessage + 'object s_cond;'
        // Destination Block
        regaMessage = regaMessage + 'object dest = destn.DestAddSingle();'
        regaMessage = regaMessage + 'dest.DestinationParam(ivtObjectId);'
        regaMessage = regaMessage + 'dest.DestinationChannel(' + channelID + ');'
        regaMessage = regaMessage + 'dest.DestinationDP(' + channelDpId + ');'
        regaMessage = regaMessage + 'dest.DestinationValueType(ivtBinary);'
        regaMessage = regaMessage + 'dest.DestinationValue(1);'

        // loop thru all variables
        varList.map((variable) => {
          let oVar = self.variableWithName(variable)
          if ((oVar) && (oVar.id)) {
            regaMessage = regaMessage + 's_cond = n_condition.CndAddSingle();'
            regaMessage = regaMessage + 's_cond.OperatorType(2);'
            regaMessage = regaMessage + 's_cond.ConditionType(9);'
            regaMessage = regaMessage + 's_cond.ConditionType2(13);'
            regaMessage = regaMessage + 's_cond.LeftValType(19);'
            regaMessage = regaMessage + 's_cond.ConditionChannel(65535);'
            regaMessage = regaMessage + 's_cond.LeftVal(' + oVar.id + ');'
            if ((oVar.valuetype === 4) || (oVar.valuetype === 16)) {
              regaMessage = regaMessage + 's_cond.RightVal1(0);'
            } else {
              regaMessage = regaMessage + 's_cond.RightVal1("");'
            }
          }
        })
        // and send regaMessage
        regaMessage = regaMessage + 'program.Active(true);'
        regaMessage = regaMessage + 'dom.RTUpdate(0);'
        await rega.script(regaMessage)
      } catch (e) {
        this.log.error(e)
      }
    } else {
      this.log.debug('[CCU] updateCCUVarTrigger unable to get datapointids')
    }
  }

  async getCCUDutyCycle () {
    // first get the BidCos-RF Interface
    var result = {}
    this.log.debug('[CCU] fetching dutycycle for BidCos-RF')
    let bci = this.getInterfaceWithName('BidCos-RF')
    if (bci) {
      this.log.debug('[CCU] BidCos-RF found sending listBidcosInterfaces command')
      let lbIResult = await this.sendInterfaceCommand(bci.name, 'listBidcosInterfaces', [])
      this.log.debug('[CCU] BidCos-RF listBidcosInterfaces result %s', JSON.stringify(lbIResult))
      if (lbIResult) {
        lbIResult.map(hwIf => {
          result[hwIf.ADDRESS] = hwIf.DUTY_CYCLE
        })
      }
    }
    return result
  }

  /**
   * depending on debugging the monitoring service will be enabled if user has set the flag for that
   */
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
        self.log.debug('[CCU] adding interface %s with id %s', oInteface.name, ifId)
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
