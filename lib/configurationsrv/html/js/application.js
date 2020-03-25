import {Network} from './network.js'

import {Button, Input, Grid, Label, DatabaseGrid} from './ui.js'

import {
  NewDeviceWizzard, PublishDevicesSettingsWizzard, EditDeviceWizzard, DeleteDeviceWizzard,
  NewHAPInstanceWizzard, DeleteHapInstanceWizzard, EditHapInstanceWizzard,
  NewObjectWizzard, EditObjectWizzard, DeleteVariableWizzard} from './wizzards.js'

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
    if (this.variableList) {
      oOv.append(this.__('%s mapped variable(s)', this.variableList.length))
      oOv.append('<br /><br />')
    }
    if (this.programList) {
      oOv.append(this.__('%s mapped program(s)', this.programList.length))
    }
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
    sOv.append(this.__('%s MB free memory', mem)).append('<br /><br />')
    sOv.append(this.__('Version %s', this.systemInfo.version)).append('<br /><br />')
    if (this.systemInfo.version !== this.systemInfo.update) {
      let update = $('<div>').append(this.__('update to %s', this.systemInfo.update))
      sOv.append(update)
      update.bind('click', async () => {
        await this.makeApiRequest({method: 'update'})
      })
      update.attr('style', 'cursor:pointer')
    }

    let restart = $('<div>').append(this.__('Restart HAP'))
    sOv.append(restart)
    restart.bind('click', async () => {
      await this.makeApiRequest({method: 'restart'})
    })
    restart.attr('style', 'cursor:pointer')
  }

  buildDeviceList () {
    let self = this
    $('#containerTitle').html(self.__('Devices'))
    let deviceContainer = $('#container')
    let containerFooter = $('#container_footer')

    deviceContainer.empty()

    let grid = new DatabaseGrid('deviceList', this.deviceList, {})

    grid.setTitleLabels([self.__('Address'), self.__('Homekit name'), self.__('Service'), self.__('Instance')])
    grid.setColumns([
      {sz: {sm: 6, md: 2, lg: 2, xl: 2}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 2}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 3}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 2}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 2}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 1}}
    ])
    grid.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      return (((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
      ((element.serial) && (element.serial.toLowerCase().indexOf(filter.toLowerCase()) > -1)))
    })

    grid.setRenderer((row, item) => {
      let editButton = new Button('success', self.__('Edit'), (e, btn) => {
        new EditDeviceWizzard(this).run(item)
      }, true)

      let deleteButton = new Button('danger', self.__('Delete'), (e, btn) => {
        new DeleteDeviceWizzard(this).run(item)
      }, true)

      let badgeState = (item.isPublished === true) ? 'badge-success' : 'badge-secondary'
      let bridge = self.getBridgeWithId(item.instanceID)

      return ([
        item.serial + ':' + item.channel,
        item.name,
        item.serviceClass,
        $('<span>').attr('class', 'badge ' + badgeState).append(bridge.displayName),

        editButton.render(),
        deleteButton.render()])
    })

    deviceContainer.append(grid.render())

    let newButton = new Button('primary', self.__('New'), async (e, btn) => {
      let mapDevices = await this.makeApiRequest({method: 'newDevice'})
      new NewDeviceWizzard(this).run(mapDevices.devices)
    })
    newButton.setStyle('float:right')
    containerFooter.empty()
    containerFooter.append(newButton.render())
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

  getProgramBySerial (progSerial) {
    var result
    this.programList.map(program => {
      if (program.serial === progSerial) {
        result = program
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

    let grid = new DatabaseGrid('instList', this.bridges, {})

    grid.setTitleLabels([self.__('Instance name'), self.__('PinCode'), self.__('Published devices')])

    grid.setColumns([
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 2, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 2}},
      {sz: {sm: 6, md: 2, lg: 1, xl: 1}}
    ])

    grid.setRenderer((row, item) => {
      let editButton = new Button('success', self.__('Edit'), (e, btn) => {
        new EditHapInstanceWizzard(this).run(item)
      }, true)

      let deleteButton = new Button('danger', self.__('Delete'), (e, btn) => {
        new DeleteHapInstanceWizzard(this).run(item)
      }, true)
      // b6589fc6-ab0d-4c82-8f12-099d1c2d40ab is the default ID
      if (item.id === 'b6589fc6-ab0d-4c82-8f12-099d1c2d40ab') {
        deleteButton.setActive(false)
        editButton.setActive(false)
      }

      return ([item.displayName,
        item.pincode,
        item.hasPublishedDevices ? self.__('Yes') : self.__('No'),
        editButton.render(),
        deleteButton.render()
      ])
    })
    hapCcontainer.append(grid.render())

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

    let grid = new DatabaseGrid('varList', this.variableList, {})

    grid.setTitleLabels([self.__('HomeKit name'), self.__('HomeMatic name'), self.__('Instance name')])

    grid.setColumns([
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 2, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 2}},
      {sz: {sm: 6, md: 2, lg: 1, xl: 1}}
    ])

    grid.setRenderer((row, item) => {
      let editButton = new Button('success', self.__('Edit'), (e, btn) => {
        let wz = new EditObjectWizzard(self, self.__('Edit variable'))

        wz.willSave((wizzard) => {
          wizzard.objectData.method = 'saveVariable'
        })

        wz.onClose(() => {
          self.refreshVariables()
        })

        wz.run(item)
      }, true)

      let deleteButton = new Button('danger', self.__('Delete'), (e, btn) => {
        new DeleteVariableWizzard(this).run(item)
      }, true)

      let bridge = self.getBridgeWithId(item.instanceID)
      let badgeState = (item.isPublished === true) ? 'badge-success' : 'badge-secondary'

      return ([item.name, item.serial, $('<span>').attr('class', 'badge ' + badgeState).append(bridge.displayName), editButton.render(), deleteButton.render()])
    })

    hapCcontainer.append(grid.render())

    let newButton = new Button('primary', self.__('New'), async (e, btn) => {
      let mapVariables = await this.makeApiRequest({method: 'newVariable'})
      let wz = new NewObjectWizzard(this, this.__('Add new Variable'), this.__('Setup variable'))

      wz.willSave((wizzard) => {
        wizzard.objectData.method = 'saveVariable'
      })

      wz.onClose(() => {
        self.refreshVariables()
      })

      wz.checkObjectIsMapped((item) => {
        return self.getVariableBySerial(item.name)
      })

      wz.setListTitles([self.__('Variable'), self.__('Description')])

      wz.run(mapVariables.variables)
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

    let gridFooter = new Grid()
    gridFooter.addRow().addCell({sm: 12, md: 12, lg: 12, xl: 12}, newButton.render())

    let triggerRow = gridFooter.addRow('', {rowStyle: 'margin-bottom:15px'})
    triggerRow.addCell({sm: 12, md: 6, lg: 4, xl: 4}, varTrigger.render())
    triggerRow.addCell({sm: 12, md: 6, lg: 4, xl: 4}, UpdateTriggerButton.render())

    gridFooter.addRow().addCell({sm: 12, md: 12, lg: 12, xl: 12}, new Label(this.__('This has to be a KEY datapoint. All variables will be updated on an event at this KEY')).render())
    containerFooter.append(gridFooter.render())
  }

  showPrograms () {
    let self = this
    $('#containerTitle').html(self.__('Programs'))
    let hapCcontainer = $('#container')
    let containerFooter = $('#container_footer')
    hapCcontainer.empty()

    let grid = new DatabaseGrid('progList', this.programList, {})

    grid.setTitleLabels([self.__('HomeKit name'), self.__('HomeMatic name'), self.__('Instance name')])

    grid.setColumns([
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 2, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 2, lg: 2, xl: 2}},
      {sz: {sm: 6, md: 2, lg: 1, xl: 1}}
    ])

    grid.setRenderer((row, item) => {
      let editButton = new Button('success', self.__('Edit'), (e, btn) => {
        let wz = new EditObjectWizzard(self, self.__('Edit program'))

        wz.willSave((wizzard) => {
          wizzard.objectData.method = 'saveProgram'
        })

        wz.onClose(() => {
          self.refreshPrograms()
        })

        wz.run(item)
      }, true)

      let deleteButton = new Button('danger', self.__('Delete'), (e, btn) => {
      }, true)

      let bridge = self.getBridgeWithId(item.instanceID)
      let badgeState = (item.isPublished === true) ? 'badge-success' : 'badge-secondary'

      return ([item.name, item.serial, $('<span>').attr('class', 'badge ' + badgeState).append(bridge.displayName), editButton.render(), deleteButton.render()])
    })

    hapCcontainer.append(grid.render())

    let newButton = new Button('primary', self.__('New'), async (e, btn) => {
      let mapPrograms = await this.makeApiRequest({method: 'newProgram'})
      let wz = new NewObjectWizzard(this, this.__('Add new program'), this.__('Setup program'))

      wz.willSave((wizzard) => {
        wizzard.objectData.method = 'saveProgram'
      })

      wz.onClose(() => {
        self.refreshPrograms()
      })

      wz.checkObjectIsMapped((item) => {
        return self.getProgramBySerial(item.name)
      })

      wz.setListTitles([self.__('Program'), self.__('Description')])

      wz.run(mapPrograms.programs)
    })
    newButton.setStyle('float:right')

    containerFooter.empty()
    containerFooter.append(newButton.render())
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

  async refreshPrograms () {
    let tmp = await this.makeApiRequest({method: 'programlist'})
    if (tmp) {
      this.programList = tmp.programs
    }
    this.showPrograms()
  }

  async refreshAll () {
    this.bridges = await this.makeApiRequest({method: 'bridges'})
    this.deviceList = await this.makeApiRequest({method: 'devicelist'})
    let tmp = await this.makeApiRequest({method: 'variablelist'})
    if (tmp) {
      this.variableList = tmp.variables
      this.variableTrigger = tmp.trigger
    }

    tmp = await this.makeApiRequest({method: 'programlist'})
    if (tmp) {
      this.programList = tmp.programs
    }

    this.buildDeviceList(0, 10)
    this.systemInfo = await this.makeApiRequest({method: 'system'})
    this.buildOverview()
  }

  hook () {
    let self = this
    $('#showDevices').bind('click', (e) => {
      self.refreshAll()
      $('#breadcrum_page').html(this.__('Devices'))
    })

    $('#publishingSettings').bind('click', (e) => {
      new PublishDevicesSettingsWizzard(this).run()
    })

    $('#hapInstances').bind('click', (e) => {
      self.showInstances()
      $('#breadcrum_page').html(this.__('HomeKit Instances'))
    })

    $('#showVariables').bind('click', (e) => {
      self.showVariables()
      $('#breadcrum_page').html(this.__('Variables'))
    })

    $('#showPrograms').bind('click', (e) => {
      self.showPrograms()
      $('#breadcrum_page').html(this.__('Programs'))
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
    this.deviceList = []
    this.variableList = []
    this.programList = []
    this.hook()
    this.refreshAll()
  }
}
