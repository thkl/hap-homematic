import {Network} from './network.js'
import {Dialog, Table, DatabaseTable, Button, Dropdown, Input, CheckBox} from './ui.js'

export class Application {
  constructor () {
    let network = new Network()
    this.makeApiRequest = network.makeApiRequest
  }

  buildPublishPopup () {
    let self = this
    let content = $('<div>').append('For the first setup you want to expose the bridge(s) without devices to homekit. So you are easily able to assign rooms to that bridge(s). If you do another publish with devices in the second step, they will be automaticaly added to the room where the particular bridge is located.')
    content.append('<br /><br />')
    content.append('Publish bridge instances with devices:<br /><br />')
    this.bridges.map(bridge => {
      let checkBox = new CheckBox('publish_' + bridge.id, (bridge.hasPublishedDevices === true), (e, input) => {
        bridge.publish = true
      })
      // if the bridge was published with devices user cannot remove the checkbox anymore
      if (bridge.hasPublishedDevices === true) {
        checkBox.setEnabled(false)
      }
      checkBox.setLabel('Publish devices for ' + bridge.displayName)
      content.append(checkBox.render())
      content.append('<br />')
    })

    let dialog = new Dialog({
      dialogId: 'publish',
      buttons: [
        new Button('light', 'Dismiss', (e, btn) => {
          dialog.close()
        }, true),

        new Button('success', 'Publish', (e, btn) => {
          self.publish()
          dialog.close()
        }, true)
      ],
      title: 'Publish devices',
      dialogClass: 'modal-info'
    })
    dialog.setBody(content)
    dialog.open()
  }

  buildOverview () {
    let oOv = $('#deviceOverview')
    oOv.empty()

    oOv.append(this.deviceList.length + ' mapped device(s)')

    let bOv = $('#bridgeOverview')
    bOv.empty()
    bOv.append(this.bridges.length + ' running HAP instances<br />')
    this.bridges.map(bridge => {
      bOv.append(bridge.displayName + ' (' + bridge.pincode + ')<br />')
    })

    let numCores = this.systemInfo.cpu.length
    let coreInfo = this.systemInfo.cpu[0].model || 'unknown cpu'
    let mem = (parseInt(this.systemInfo.mem) / 1000000).toFixed(2)

    let sOv = $('#sysOverview')
    sOv.empty()
    sOv.append(numCores + ' cores ' + coreInfo + '<br /><br />')
    sOv.append(mem + ' MB free memory')
  }

  buildDeviceList (start, count) {
    let deviceContainer = $('#deviceContainer')
    deviceContainer.empty()
    let table = new DatabaseTable('curdevice', deviceContainer, 'table-bordered table-striped table-sm', this.deviceList)
    table.addSearchBar('Search', (element, filter) => {
      return (((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
      ((element.serial) && (element.serial.toLowerCase().indexOf(filter.toLowerCase()) > -1)))
    })
    table.setColumns(['Address', 'Name', 'Service', 'Instance', '', ''])
    table.setRenderer(device => {
      let result = []
      let editButton = new Button('success', 'Edit', (e, btn) => {

      }, true)

      let deleteButton = new Button('danger', 'Delete', (e, btn) => {

      }, true)

      result.push(device.serial + ':' + device.channel)
      result.push(device.name)
      result.push(device.serviceClass)
      let badgeState = (device.isPublished === true) ? 'badge-success' : 'badge-secondary'
      result.push($('<span>').attr('class', 'badge ' + badgeState).append(device.instanceID))
      result.push(editButton.render())
      result.push(deleteButton.render())
      return result
    })
    table.render()
  }

  getServiceByAddress (chAddress) {
    var result
    this.deviceList.map(element => {
      if (element.serial + ':' + element.channel === chAddress) {
        result = element
      }
    })
    return result
  }

  async buildNewDeviceStep2 (newService) {
    let channel = newService.channel
    newService.name = channel.name
    let content = $('<div>Please setup the service for ' + channel.name + ' (' + channel.address + ')<br /><br />')
    let table = new Table(content)
    table.setColumns(['', '', ''])
    table.render()
    let serviceList = await this.makeApiRequest({method: 'service', channelAddress: channel.address})
    newService.service = serviceList.service[0]
    let oServiceList = new Dropdown('newDeviceService', newService.service)
    serviceList.service.map(service => {
      oServiceList.addItem({
        title: service,
        value: service,
        onClick: (e, btn) => {
          newService.service = btn
        }
      })
    })

    let hapList = new Dropdown('newDeviceHapList', 'Select a instance')
    this.bridges.map(bridge => {
      hapList.addItem({
        title: bridge.displayName,
        value: bridge.id,
        onClick: (e, btn) => {
          newService.hapInstance = btn
        }
      })
    })

    let inputName = new Input('devicename', channel.name, (e, input) => {
      newService.name = input.value
    })
    table.addRow(

      [
        'Homekit Device name',
        inputName.render(),
        'You may change the devicename as u like.'
      ]
    )

    table.addRow(

      [
        'Service',
        oServiceList.render(),
        'Select the service you want to use for this channel'
      ]
    )
    table.addRow(
      [
        'Space for additional Settings'
      ]
    )

    table.addRow(
      [
        'HAP Instance',
        hapList.render(),
        'Select the HAP Instance to which you want to add this channel'
      ]

    )
    table.render()
    this.newDeviceDialog.setBody(content)
  }

  async saveDevice (data) {
    await this.makeApiRequest(data)
    this.newDeviceDialog.close()
  }

  buildNewDeviceStep1 (deviceList) {
    let self = this
    let content = $('<div>Please select a channel to add to homekit <br /><br />')

    // build the dataset
    let dataset = []
    deviceList.map(device => {
      device.channels.map(channel => {
        dataset.push([device, channel])
      })
    })

    let table = new DatabaseTable('ndevices', content, 'table-bordered table-striped table-sm', dataset)

    table.addSearchBar('Search', (element, filter) => {
      if (element.length > 1) {
        return (((element[0].name) && (element[0].name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
        ((element[1].name) && (element[1].name.toLowerCase().indexOf(filter.toLowerCase()) > -1)))
      } else {
        return false
      }
    })

    table.setColumns(['Device', 'Type', 'Channel', 'Type', ''])
    let newService = {}
    table.setRenderer(element => {
      let result = []
      let device = element[0]
      let channel = element[1]
      result.push(device.name)
      result.push(device.type)
      result.push(channel.name)
      result.push(channel.type)

      if (self.getServiceByAddress(channel.address) === undefined) {
        let button = new Button('info', 'Select', (e, btn) => {
          newService.channel = channel
          self.buildNewDeviceStep2(newService)
          finishButton.enable(true)
        }, true)
        button.setStyle('width:100%')
        result.push(button.render())
      } else {
        let button = new Button('secondary', 'allready here', () => {}, true)
        button.setStyle('width:100%')
        result.push(button.render())
      }

      return result
    })

    table.render()

    let finishButton = new Button('success', 'Finish', (e, btn) => {
      self.saveDevice({
        method: 'savenew',
        name: newService.name,
        channel: newService.channel.address,
        service: newService.service,
        instance: newService.hapInstance
      })
    }, false)

    this.newDeviceDialog = new Dialog({
      dialogId: 'addNew',
      buttons: [
        new Button('light', 'Dismiss', (e, btn) => {
          self.newDeviceDialog.close()
        }, true),
        finishButton
      ],
      title: 'Add new device',
      dialogClass: 'modal-info',
      scrollable: true,
      size: 'modal-xl'
    })
    this.newDeviceDialog.setBody(content)
    this.newDeviceDialog.open()
  }

  async publish () {
    var bridgesToPublishDevices = []
    this.bridges.map(bridge => {
      if (bridge.publish === true) {
        bridgesToPublishDevices.push(bridge.id)
      }
    })
    await this.makeApiRequest({method: 'publish', bridges: JSON.stringify(bridgesToPublishDevices)})
  }

  async refreshAll () {
    this.deviceList = await this.makeApiRequest({method: 'devicelist'})
    this.buildDeviceList(0, 10)
    this.bridges = await this.makeApiRequest({method: 'bridges'})
    this.systemInfo = await this.makeApiRequest({method: 'system'})
    this.buildOverview()
  }

  hook () {
    let self = this
    $('#showDevices').bind('click', async (e) => {
      self.refreshAll()
    })

    $('#reloadDevices').bind('click', async (e) => {
      this.buildPublishPopup()
    })

    $('#newService').bind('click', async (e) => {
      let mapDevices = await this.makeApiRequest({method: 'new'})
      self.buildNewDeviceStep1(mapDevices.devices)
    })
  }

  async run () {
    this.hook()
    this.refreshAll()
  }
}
