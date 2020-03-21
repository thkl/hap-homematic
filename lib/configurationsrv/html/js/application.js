import {Network} from './network.js'

import {DatabaseTable, Button} from './ui.js'

import {NewDeviceWizzard, PublishDevicesSettingsWizzard, DeleteDeviceWizzard,
  DeleteHapInstanceWizzard, EditHapInstanceWizzard,
  NewHAPInstanceWizzard, EditDeviceWizzard} from './wizzards.js'

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
      let mapDevices = await this.makeApiRequest({method: 'new'})
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

  async refreshAll () {
    this.bridges = await this.makeApiRequest({method: 'bridges'})
    this.deviceList = await this.makeApiRequest({method: 'devicelist'})
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
