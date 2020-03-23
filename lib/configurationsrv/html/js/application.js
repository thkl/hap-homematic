import {Network} from './network.js'

import {DatabaseTable, Button, Input, Grid, Label} from './ui.js'

import {
  NewDeviceWizzard, PublishDevicesSettingsWizzard, EditDeviceWizzard, DeleteDeviceWizzard,
  NewHAPInstanceWizzard, DeleteHapInstanceWizzard, EditHapInstanceWizzard,
  NewVariableWizzard, EditVariableWizzard, DeleteVariableWizzard} from './wizzards.js'

import {Localization} from './localization.js'

export class Application {
  constructor () {
    let network = new Network()
    this.makeApiRequest = network.makeApiRequest
  }

  buildOverview () {
    let oOv = $('#deviceOverview')
    oOv.empty()

    oOv.append(this.__('%s mapped device(s)', this.deviceList.length))
    oOv.append('<br /><br />')
    oOv.append(this.__('%s mapped variable(s)', this.variableList.length))

    let bOv = $('#bridgeOverview')
    bOv.empty()
    bOv.append(this.__('%s running HAP instances', this.bridges.length)).append('<br />')
    this.bridges.map(bridge => {
      bOv.append(bridge.displayName + ' (' + bridge.pincode + ')').append('<br />')
    })

    let numCores = this.systemInfo.cpu.length
    let coreInfo = this.systemInfo.cpu[0].model || 'unknown cpu'
    let mem = (parseInt(this.systemInfo.mem) / 1000000).toFixed(2)

    let sOv = $('#sysOverview')
    sOv.empty()
    sOv.append(this.__('%s cores %s', numCores, coreInfo)).append('<br /><br />')
    sOv.append(this.__('%s MB free memory', mem))
  }

  buildDeviceList () {
    let self = this
    $('#containerTitle').html(self.__('Devices'))
    let deviceContainer = $('#container')
    let containerFooter = $('#container_footer')

    deviceContainer.empty()
    let table = new DatabaseTable('curdevice', deviceContainer, 'table-bordered table-striped table-sm', this.deviceList)
    table.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      return (((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
      ((element.serial) && (element.serial.toLowerCase().indexOf(filter.toLowerCase()) > -1)))
    })
    table.setColumns([self.__('Address'), self.__('Homekit name'), self.__('Service'), self.__('Instance'), '', ''])
    table.setRenderer(device => {
      let result = []
      let editButton = new Button('success', self.__('Edit'), (e, btn) => {
        new EditDeviceWizzard(this).run(device)
      }, true)

      let deleteButton = new Button('danger', self.__('Delete'), (e, btn) => {
        new DeleteDeviceWizzard(this).run(device)
      }, true)

      result.push(device.serial + ':' + device.channel)
      result.push(device.name)
      result.push(device.serviceClass)
      let badgeState = (device.isPublished === true) ? 'badge-success' : 'badge-secondary'
      let bridge = self.getBridgeWithId(device.instanceID)
      result.push($('<span>').attr('class', 'badge ' + badgeState).append(bridge.displayName))
      result.push(editButton.render())
      result.push(deleteButton.render())
      return result
    })

    let newButton = new Button('primary', self.__('New'), async (e, btn) => {
      let mapDevices = await this.makeApiRequest({method: 'newDevice'})
      new NewDeviceWizzard(this).run(mapDevices.devices)
    })
    newButton.setStyle('float:right')
    containerFooter.empty()
    containerFooter.append(newButton.render())
    table.render()
  }

  getDeviceList () {
    return this.deviceList
  }

  getBridges () {
    return this.bridges
  }

  getBridgeWithId (id) {
    var result
    this.bridges.map(bridge => {
      if (bridge.id === id) {
        result = bridge
      }
    })
    return result
  }

  getServiceByAddress (chAddress) {
    var result
    this.getDeviceList().map(element => {
      if (element.serial + ':' + element.channel === chAddress) {
        result = element
      }
    })
    return result
  }

  getVariableBySerial (varSerial) {
    var result
    this.variableList.map(variable => {
      if (variable.serial === varSerial) {
        result = variable
      }
    })
    return result
  }

  showInstances () {
    let self = this
    $('#containerTitle').html(self.__('HomeKit Instances'))
    let hapCcontainer = $('#container')
    let containerFooter = $('#container_footer')
    hapCcontainer.empty()
    let table = new DatabaseTable('haplist', hapCcontainer, 'table-bordered table-striped table-sm', this.bridges)
    table.setColumns([self.__('Instance name'), self.__('PinCode'), self.__('Published devices'), '', ''])
    table.setRenderer(bridge => {
      let result = []
      let editButton = new Button('success', self.__('Edit'), (e, btn) => {
        new EditHapInstanceWizzard(this).run(bridge)
      }, true)

      let deleteButton = new Button('danger', self.__('Delete'), (e, btn) => {
        new DeleteHapInstanceWizzard(this).run(bridge)
      }, true)
      // b6589fc6-ab0d-4c82-8f12-099d1c2d40ab is the default ID
      if (bridge.id === 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab') {
        deleteButton.setActive(false)
        editButton.setActive(false)
      }

      result.push(bridge.displayName)
      result.push(bridge.pincode)
      result.push(bridge.hasPublishedDevices ? self.__('Yes') : self.__('No'))
      result.push(editButton.render())
      result.push(deleteButton.render())

      return result
    })
    table.render()

    let newButton = new Button('primary', self.__('New'), async (e, btn) => {
      new NewHAPInstanceWizzard(this).run()
    })
    newButton.setStyle('float:right')
    containerFooter.empty()
    containerFooter.append(newButton.render())
  }

  showVariables () {
    let self = this
    $('#containerTitle').html(self.__('Variables'))
    let hapCcontainer = $('#container')
    let containerFooter = $('#container_footer')
    hapCcontainer.empty()
    let table = new DatabaseTable('haplist', hapCcontainer, 'table-bordered table-striped table-sm', this.variableList)
    table.setColumns([self.__('HomeKit name'), self.__('HomeMatic name'), '', ''])
    table.setRenderer(variable => {
      let result = []
      let editButton = new Button('success', self.__('Edit'), (e, btn) => {
        new EditVariableWizzard(this).run(variable)
      }, true)

      let deleteButton = new Button('danger', self.__('Delete'), (e, btn) => {
        new DeleteVariableWizzard(this).run(variable)
      }, true)

      result.push(variable.name)
      result.push(variable.serial)
      result.push(editButton.render())
      result.push(deleteButton.render())

      return result
    })
    table.render()

    let newButton = new Button('primary', self.__('New'), async (e, btn) => {
      let mapVariables = await this.makeApiRequest({method: 'newVariable'})
      new NewVariableWizzard(this).run(mapVariables.variables)
    })
    newButton.setStyle('float:right')

    let varTrigger = new Input('varTrigger', this.variableTrigger, (e, input) => {

    })
    varTrigger.setStyle('width:100%')
    varTrigger.setGroupLabel('Trigger')

    let UpdateTriggerButton = new Button('primary', self.__('Update Trigger'), async (e, btn) => {
      let triggerDp = varTrigger.getValue()
      if (triggerDp) {
        await self.makeApiRequest({method: 'saveVariableTrigger', datapoint: triggerDp})
        self.refreshVariables()
      }
    })
    UpdateTriggerButton.setStyle('float:right')

    containerFooter.empty()

    let grid = new Grid()
    grid.addRow().addCell(12, 12, newButton.render())

    let triggerRow = grid.addRow('', {rowStyle: 'margin-bottom:15px'})
    triggerRow.addCell(4, 12, varTrigger.render())
    triggerRow.addCell(2, 12, UpdateTriggerButton.render())

    grid.addRow().addCell(12, 12, new Label(this.__('This has to be a KEY datapoint. All variables will be updated on an event at this KEY')).render())
    containerFooter.append(grid.render())
  }

  async publish (bridgeId) {
    var bridgesToPublishDevices = []
    this.bridges.map(bridge => {
      if ((bridge.publish === true) || (bridge.id === bridgeId)) {
        bridgesToPublishDevices.push(bridge.id)
      }
    })
    await this.makeApiRequest({method: 'publish', bridges: JSON.stringify(bridgesToPublishDevices)})
  }

  async refreshBridges () {
    this.bridges = await this.makeApiRequest({method: 'bridges'})
    this.buildOverview()
    this.showInstances()
  }

  async refreshVariables () {
    let tmp = await this.makeApiRequest({method: 'variablelist'})
    if (tmp) {
      this.variableList = tmp.variables
      this.variableTrigger = tmp.trigger
    }
    this.showVariables()
  }

  async refreshAll () {
    this.bridges = await this.makeApiRequest({method: 'bridges'})
    this.deviceList = await this.makeApiRequest({method: 'devicelist'})
    let tmp = await this.makeApiRequest({method: 'variablelist'})
    if (tmp) {
      this.variableList = tmp.variables
      this.variableTrigger = tmp.trigger
    }
    this.buildDeviceList(0, 10)
    this.systemInfo = await this.makeApiRequest({method: 'system'})
    this.buildOverview()
  }

  hook () {
    let self = this
    $('#showDevices').bind('click', (e) => {
      self.refreshAll()
    })

    $('#publishingSettings').bind('click', (e) => {
      new PublishDevicesSettingsWizzard(this).run()
    })

    $('#hapInstances').bind('click', (e) => {
      self.showInstances()
    })

    $('#showVariables').bind('click', (e) => {
      self.showVariables()
    })
  }

  // this will drive me nuts .. i can feel it
  __ () {
    return this.localizer.localize.apply(this.localizer, arguments)
  }

  async run () {
    this.localizer = new Localization()
    await this.localizer.init()
    this.localizer.localizePage()
    this.hook()
    this.refreshAll()
  }
}
