const path = require('path')
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
    return new Promise((resolve, reject) => {
      self._fetchInterfaces().then(o => {
        self._fetchHomeKitSubSectionIDs(this.configuration.subsection || 'HomeKit').then(oo => {
          resolve()
        })
      })
    })
  }

  shutdown () {
    this.log.debug('[CCU] shutdown')
    if (this.rpc) {
      this.rpc.stop()
    }
    this.log.debug('[CCU] shutdown completed')
  }

  fetchDevices () {
    let self = this
    return new Promise((resolve, reject) => {
    // first build a \t string from channel IDs
      let cList = this.sectionChannelIds.join('\t')
      var script = 'string cid;boolean df=true;'
      script = script + 'string list = \'' + cList + '\';'
      script = script + 'Write(\'{"channels":[\');foreach(cid, list){object oCh = dom.GetObject(cid);var did = oCh.Device(); if (did) {object oDe = dom.GetObject(did);} if(df) {df = false;} else { Write(\',\');}Write(\'{\')'
      script = script + self._scriptPartForElement('id', 'cid', ',')
      script = script + self._scriptPartForElement('name', 'oCh.Name()', ',')
      script = script + self._scriptPartForElement('type', 'oCh.HssType()', ',')
      script = script + self._scriptPartForElement('intf', 'oCh.Interface()', ',')
      script = script + self._scriptPartForElement('dtype', 'oDe.HssType()', ',')
      script = script + self._scriptPartForElement('address', 'oCh.Address()')
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

  connectInterfaces () {
    let self = this
    self.log.debug('[CCU] creating eventserver ')
    this.rpc = new HomeMaticRPC(this, 9875)
    this.rpc.init()
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
      self.log.debug('[CCU] event on %s with value %s', event.address, event.value)
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

  registeraddressForEventProcessingAtAccessory (address, callback) {
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
      script = script + self._scriptPartForElement('id', 'sifId', ',')
      script = script + self._scriptPartForElement('name', 'oIf.Name()', ',')
      script = script + self._scriptPartForElement('type', 'oIf.Type()', ',')
      script = script + self._scriptPartForElement('typename', 'oIf.TypeName()', ',')
      script = script + self._scriptPartForElement('info', 'oIf.InterfaceInfo()', ',')
      script = script + self._scriptPartForElement('url', 'oIf.InterfaceUrl()')
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

  _scriptPartForElement (elementName, functionName, leadingComa = '') {
    return 'Write(\'"' + elementName + '": "\' # ' + functionName + ' # \'"' + leadingComa + '\');'
  }
}

module.exports = HomeMaticCCU
