import {Dialog, Table, DatabaseTable, Button, Dropdown, Input, CheckBox, Spinner} from './ui.js'

export class Wizzard {
  constructor (application) {
    this.application = application
    let self = this
    this.activitySpinner = new Spinner()
    this.dissmissButton = new Button('light', self.__('Dismiss'), (e, btn) => {
      if (self.dialog) {
        self.dialog.close()
      }
    }, true)
  }

  __ () {
    // this is crazy
    return this.application.__.apply(this.application, arguments)
  }

  run () {
    if (this.dialog) {
      this.dialog.open()
    }
  }
}

export class DeleteItemWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this

    let deleteButton = new Button('danger', self.__('Yes, kick it baby'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      deleteButton.setActive(false)
      self.deleteItem()

      setTimeout(() => {
        self.application.refreshAll()
        self.deleteDialog.close()
      }, 2000)
    }, true)

    this.dialog = new Dialog({
      dialogId: self.getDialogId(),
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        deleteButton
      ],
      title: self.getTitle(),
      dialogClass: 'modal-danger',
      scrollable: true,
      size: 'modal-md'
    })
  }

  getDialogId () { return 'id' }
  getTitle () { return 'YOU SHOULD PROVIDE A TITLE IN YOUR SUBCLASS' }
  deleteItem () {}
}

/** this is the dialog class for removing an device */
export class DeleteDeviceWizzard extends DeleteItemWizzard {
  async deleteItem () {
    await this.application.makeApiRequest({method: 'remove', uuid: this.device.UUID})
  }

  getDialogId () { return 'deleteDeviceDialog' }
  getTitle () { return this.__('Remove ...') }

  run (device) {
    this.device = device
    this.dialog.setBody(this.__('Are you shure you want to remove %s from HomeKit?', device.name))
    this.dialog.open()
  }
}

/** this is the dialog class for removing an hap instance */
export class DeleteHapInstanceWizzard extends DeleteItemWizzard {
  async deleteItem () {
    if (this.hapInstance.id !== 0) {
      await this.application.makeApiRequest({method: 'removehapinstance', id: this.hapInstance.id})
    }
  }

  getDialogId () { return 'deleteDeviceDialog' }
  getTitle () { return this.__('Remove ...') }

  run (hapInstance) {
    this.hapInstance = hapInstance
    this.dialog.setBody(this.__('Are you shure you want to remove %s? All your devices will be reassigned to the default Instance.', hapInstance.displayName))
    this.dialog.open()
  }
}

export class EditHapInstanceWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      self.finishButton.setActive(false)
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
    }, false)

    self.dialog = new Dialog({
      dialogId: 'editHAP',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.__('Edit Homekit instance'),
      dialogClass: 'modal-info',
      scrollable: true,
      size: 'modal-xl'
    })
  }

  run (hapInstance) {
    this.hapInstance = hapInstance
    this.dialog.setBody()
    this.dialog.open()
  }
}

export class NewDeviceWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.newService = {}

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      self.finishButton.setActive(false)
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      self.createNewDevice()
    }, false)

    self.dialog = new Dialog({
      dialogId: 'addNew',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.__('Add new device'),
      dialogClass: 'modal-info',
      scrollable: true,
      size: 'modal-xl'
    })
  }

  async buildNewDeviceStep2 () {
    let self = this
    let channel = self.newService.channel
    self.newService.name = channel.name

    let content = $('<div>').append(self.__('Please setup the service for %s  (%s)', channel.name, channel.address)).append('<br /><br />')
    let table = new Table(content)
    table.setColumns(['', '', ''])

    let serviceList = await self.application.makeApiRequest({method: 'service', channelAddress: channel.address})
    self.newService.service = serviceList.service[0]

    let oServiceList = new Dropdown('newDeviceService', self.newService.service)
    serviceList.service.map(service => {
      oServiceList.addItem({
        title: service,
        value: service,
        onClick: (e, btn) => {
          self.newService.service = btn
        }
      })
    })

    let publish = new CheckBox('pulbishDevice', true, (e, chk) => {
      self.newService.publish = chk.checked
    })
    publish.setLabel(self.__('Publish device ?'))
    let hapList = new Dropdown('newDeviceHapList', self.__('Select a instance'))
    self.application.getBridges().map(bridge => {
      hapList.addItem({
        title: bridge.displayName,
        value: bridge.id,
        onClick: (e, btn) => {
          self.newService.hapInstance = btn
          let bridge = self.application.getBridgeWithId(parseInt(btn))
          if ((bridge) && (bridge.hasPublishedDevices === true)) {
            publish.setValue(true)
            publish.setEnabled(false)
          } else {
            publish.setEnabled(true)
          }
        }
      })
    })

    let inputName = new Input('devicename', channel.name, (e, input) => {
      self.newService.name = input.value
    })

    table.addRow([self.__('Homekit Device name'), inputName.render(), self.__('You may change the devicename as u like.')])
    table.addRow([self.__('Service'), oServiceList.render(), self.__('Select the service you want to use for this channel')])
    table.addRow([self.__('Space for additional Settings')])
    table.addRow([self.__('HAP Instance'), hapList.render(), self.__('Select the HAP Instance to which you want to add this channel')])
    table.addRow([self.__('Publish'), publish.render(), self.__('Publish device immediately to HomeKit (note: all other devices for this instance will also be published)')])

    table.render()
    self.dialog.setBody(content)
  }

  run (deviceList) {
    let self = this
    let content = $('<div>').append(self.__('Please select a channel to add to homeKit')).append('<br /><br />')

    // build the dataset
    let dataset = []
    deviceList.map(device => {
      device.channels.map(channel => {
        dataset.push([device, channel])
      })
    })

    let table = new DatabaseTable('ndevices', content, 'table-bordered table-striped table-sm', dataset)

    table.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      if (element.length > 1) {
        return (((element[0].name) && (element[0].name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
            ((element[1].name) && (element[1].name.toLowerCase().indexOf(filter.toLowerCase()) > -1)))
      } else {
        return false
      }
    })

    table.setColumns([self.__('Device'), self.__('Type'), self.__('Channel'), self.__('Type'), ''])

    table.setRenderer(element => {
      let result = []
      let device = element[0]
      let channel = element[1]
      result.push(device.name)
      result.push(device.type)
      result.push(channel.name)
      result.push(channel.type)

      if (self.application.getServiceByAddress(channel.address) === undefined) {
        let button = new Button('info', self.__('Select'), (e, btn) => {
          self.newService.channel = channel
          self.buildNewDeviceStep2(self.newService)
          self.finishButton.setActive(true)
        }, true)
        button.setStyle('width:100%')
        result.push(button.render())
      } else {
        let button = new Button('secondary', self.__('allready here'), () => {}, true)
        button.setStyle('width:100%')
        result.push(button.render())
      }

      return result
    })

    table.render()

    self.dialog.setBody(content)
    self.dialog.open()
  }

  async createNewDevice () {
    let self = this
    await self.application.makeApiRequest({
      method: 'savenew',
      name: self.newService.name,
      channel: self.newService.channel.address,
      service: self.newService.service,
      instance: self.newService.hapInstance
    })

    if (self.newService.publish === true) {
      await self.application.publish(parseInt(self.newService.hapInstance))
      setTimeout(() => {
        self.application.refreshAll()
        self.dialog.close()
      }, 2000)
    } else {
      await self.application.publish()
      self.application.refreshAll()
      self.dialog.close()
    }
  }
}

export class PublishDevicesWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    let content = $('<div>').append(self.__('For the first setup you want to expose the bridge(s) without devices to HomeKit. So you are easily able to assign rooms to that bridge(s). If you do another publish with devices in the second step, they will be automaticaly added to the room where the particular bridge is located.'))
    content.append('<br /><br />')
    content.append(self.__('Publish bridge instances with devices:')).append('<br /><br />')

    self.application.getBridges().map(bridge => {
      let checkBox = new CheckBox('publish_' + bridge.id, (bridge.hasPublishedDevices === true), (e, input) => {
        bridge.publish = input.checked
      })
      // if the bridge was published with devices user cannot remove the checkbox anymore
      if (bridge.hasPublishedDevices === true) {
        checkBox.setEnabled(false)
      }
      checkBox.setLabel(self.__('Publish devices for %s', bridge.displayName))
      content.append(checkBox.render())
      content.append('<br />')
    })

    let publishButton = new Button('success', self.__('Publish'), (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      publishButton.setActive(false)
      self.application.publish()
      setTimeout(() => {
        self.application.refreshAll()
        self.dialog.close()
      }, 2000)
    }, true)

    self.dialog = new Dialog({
      dialogId: 'publish',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        publishButton
      ],
      title: self.__('Publish devices'),
      dialogClass: 'modal-info'
    })
    self.dialog.setBody(content)
  }
}
/** this wizzard will create a new HAP Instance */
export class NewHAPInstanceWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    let content = $('<div>').append(self.__('Here you can setup a new HomeKit instance. Please give your instance a nice name (eg. Roomname)'))
    content.append('<br /><br />')
    let table = new Table(content)
    let newInstance = {method: 'createinstance', publish: true}
    table.setColumns([{width: 150, label: ''}, ''])

    let inputName = new Input('instancename', '', (e, input) => {
      newInstance.name = input.value
    })
    inputName.setGroupLabel('HomeMatic_')

    let publish = new CheckBox('publisInstance', true, (e, chk) => {
      newInstance.publish = chk.checked
    })
    publish.setLabel(self.__('Publish Instance ?'))

    table.addRow([self.__('Homekit instance name:'), inputName.render()])
    table.addRow([self.__('Publish'), publish.render()])

    table.render()

    let finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if (newInstance.name) {
        self.activitySpinner.setActive(true)
        self.dissmissButton.setActive(false)
        finishButton.setActive(false)
        await self.application.makeApiRequest(newInstance)
        setTimeout(() => {
          self.application.refreshBridges()
          self.dialog.close()
        }, 2000)
      } else {
        // message for missing name
      }
    }, true)

    self.dialog = new Dialog({
      dialogId: 'newhapinstance',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        finishButton
      ],
      title: self.__('Create new HomeKit instance'),
      dialogClass: 'modal-info'
    })
    self.dialog.setBody(content)
  }
}
