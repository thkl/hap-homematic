import {Dialog, Table, DatabaseTable, Button,
  Grid, DatabaseGrid,
  Dropdown, Input, CheckBox, Spinner, Label} from './ui.js'

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
        self.dialog.close()
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
    await this.application.makeApiRequest({method: 'removeDevice', uuid: this.device.UUID})
    this.application.refreshAll()
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
      this.application.refreshAll()
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

export class DeleteVariableWizzard extends DeleteItemWizzard {
  async deleteItem () {
    let self = this
    if (this.variable.serial !== undefined) {
      await this.application.makeApiRequest({method: 'removeVariable', serial: this.variable.serial, uuid: this.variable.UUID})
      setTimeout(() => {
        self.application.refreshVariables()
        self.dialog.close()
      }, 2000)
    }
  }

  getDialogId () { return 'deleteDeviceDialog' }
  getTitle () { return this.__('Remove ...') }

  run (variable) {
    this.variable = variable
    this.dialog.setBody(this.__('Are you shure you want to remove %s?', variable.name))
    this.dialog.open()
  }
}

// this is the Abstract Class used by edit and new Device Wizzard
export class AbstractEditSettingsWizzard extends Wizzard {
  async buildDeviceSettings () {
    let self = this
    self.grid.resetRows()

    let inputName = new Input('devicename', self.serviceSettings.name, (e, input) => {
      self.serviceSettings.name = input.value
    })

    let serviceList = await self.application.makeApiRequest({method: 'service', channelAddress: this.serviceSettings.address})

    let oServiceList = new Dropdown('newDeviceService', self.serviceSettings.serviceClass || '')
    serviceList.service.map(service => {
      // set the current template
      if (service.serviceClazz === self.serviceSettings.serviceClass) {
        self.serviceSettings.template = service.settings
      }
      oServiceList.addItem({
        title: service.serviceClazz,
        value: service.serviceClazz,
        onClick: async (e, btn) => {
          self.serviceSettings.serviceClass = btn
          self.serviceSettings.template = service.settings
          await self.buildDeviceSettings()
        }
      })
    })
    // create a empty settings mapp
    if (self.serviceSettings.settings === undefined) {
      self.serviceSettings.settings = {}
    }
    // select the first service if there is none
    if (self.serviceSettings.serviceClass === undefined) {
      self.serviceSettings.serviceClass = serviceList.service[0].serviceClazz
      self.serviceSettings.template = serviceList.service[0].settings
      oServiceList.setTitle(self.serviceSettings.serviceClass)
    }

    let hapList = new Dropdown('newDeviceHapList', self.__('Select a instance'))
    self.application.getBridges().map(bridge => {
      if (bridge.id === self.serviceSettings.instanceID) {
        hapList.setTitle(bridge.displayName)
      }
      hapList.addItem({
        title: bridge.displayName,
        value: bridge.id,
        onClick: (e, btn) => {
          self.serviceSettings.instanceID = btn
        }
      })
    })

    var row = self.grid.addRow('deviceName')
    row.addCell(2, 12, self.__('Homekit Device name'))
    row.addCell(5, 12, inputName.render())
    row.addCell(5, 12, self.__('You may change the devicename as u like.'))

    row = self.grid.addRow('service')
    row.addCell(2, 12, self.__('Service'))
    row.addCell(5, 12, oServiceList.render())
    row.addCell(5, 12, self.__('Select the service you want to use for this channel'))

    if (this.serviceSettings.template) {
      Object.keys(this.serviceSettings.template).map(settingsKey => {
        let template = self.serviceSettings.template[settingsKey]
        let settings = self.serviceSettings.settings[settingsKey]
        var control
        switch (template.type) {
          case 'option':
            control = new Dropdown(settingsKey, settings || template.default)
            template.array.map(item => {
              control.addItem({
                title: item,
                value: item,
                onClick: (e, btn) => {
                  self.serviceSettings.settings[settingsKey] = btn
                }
              })
            })
            break

          case 'number':
            control = new Input(settingsKey, parseInt(settings) || parseInt(template.default), (e, input) => {
              self.serviceSettings.settings[settingsKey] = parseInt(input.value)
            })
            break

          case 'text':
            control = new Input(settingsKey, settings || template.default, (e, input) => {
              self.serviceSettings.settings[settingsKey] = input.value
            })
            break

          case 'checkbox':
            control = new CheckBox(settingsKey, true, (e, input) => {
              self.serviceSettings.settings[settingsKey] = input.checked
            })
            control.setValue(settings || template.default)
            break

          default:
            break
        }
        row = self.grid.addRow('st_' + settingsKey)
        row.addCell(2, 12, self.__(template.label || ''))
        row.addCell(5, 12, (control) ? control.render() : '')
        row.addCell(5, 12, self.__(template.hint || ''))
      })
    }

    row = self.grid.addRow('hapInstance')
    row.addCell(2, 12, self.__('HAP Instance'))
    row.addCell(5, 12, hapList.render())
    row.addCell(5, 12, self.__('Select the HAP Instance to which you want to add this channel'))
  }
}

export class NewDeviceWizzard extends AbstractEditSettingsWizzard {
  constructor (application) {
    super(application)
    let self = this
    this.serviceSettings = {
      method: 'saveNewDevice'
    }

    this.status = new Label()

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if (self.serviceSettings.instanceID === undefined) {
        self.status.setLabel(self.__('Please choose a HAP instance'))
      } else {
        self.finishButton.setActive(false)
        self.activitySpinner.setActive(true)
        self.dissmissButton.setActive(false)
        self.createNewDevice()
      }
    }, false)

    self.dialog = new Dialog({
      dialogId: 'addNew',
      buttons: [
        self.status,
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

  buildSuggestedName (device, channel) {
    if ((device) && (channel)) {
      let cDefaultName = device.type + ' ' + channel.address
      let idx = cDefaultName.indexOf(channel.name)
      if (idx === -1) {
        return channel.name.replace(/[.:#_()-]/g, ' ')
      } else {
        return device.name.replace(/[.:#_()-]/g, ' ')
      }
    }
  }

  async buildNewDeviceStep2 () {
    let self = this
    let content = $('<div>').append(self.__('Please setup the service for %s  (%s)', this.channel.name, this.channel.address)).append('<br /><br />')
    this.grid = new Grid('newDeviceGrid', {rowStyle: 'margin-bottom:15px'})
    await self.buildDeviceSettings()
    content.append(this.grid.render())
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
          self.serviceSettings.name = self.buildSuggestedName(self.serviceSettings.device, self.serviceSettings.channel) || channel.name
          self.serviceSettings.channel = channel
          self.channel = channel
          self.device = device
          self.serviceSettings.address = channel.address
          self.buildNewDeviceStep2()
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
    if (self.serviceSettings.instanceID !== undefined) {
      this.status.setLabel(this.__('Creating device ...'))
      let settings = self.serviceSettings.settings
      // create JSON String from settings to make post easyer
      if (settings) {
        self.serviceSettings.settings = JSON.stringify(settings)
      }
      // remove other stuff
      if (self.serviceSettings.template) {
        delete self.serviceSettings.template
      }
      if (self.serviceSettings.channel) {
        delete self.serviceSettings.channel
      }

      await self.application.makeApiRequest(self.serviceSettings)
      await self.application.publish()
      setTimeout(() => {
        self.application.refreshAll()
        self.dialog.close()
      }, 2000)
    }
  }
}

export class EditDeviceWizzard extends AbstractEditSettingsWizzard {
  constructor (application) {
    super(application)
    let self = this

    let publishButton = new Button('success', self.__('Finish'), (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      publishButton.setActive(false)
      self.saveDevice()
      setTimeout(() => {
        self.application.refreshAll()
        self.dialog.close()
      }, 2000)
    }, true)

    self.dialog = new Dialog({
      dialogId: 'editDevice',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        publishButton
      ],
      title: self.__('Edit device'),
      dialogClass: 'modal-info'
    })
  }

  async saveDevice () {
    let settings = this.serviceSettings.settings
    if (settings) {
      this.serviceSettings.settings = JSON.stringify(settings)
    }
    // remove other stuff
    if (this.serviceSettings.template) {
      delete this.serviceSettings.template
    }
    if (this.serviceSettings.channel) {
      delete this.serviceSettings.channel
    }

    await this.application.makeApiRequest(this.serviceSettings)
    await this.application.publish()
  }

  async run (device) {
    let self = this
    this.serviceSettings = {
      method: 'saveDevice',
      name: device.name,
      address: device.serial + ':' + device.channel,
      instanceID: device.instanceID,
      serviceClass: device.serviceClass,
      settings: device.settings.settings, // this will blow my mind
      uuid: device.UUID}
    let content = $('<div>').append(self.__('Edit your device %s here', device.name))
    content.append('<br /><br />')
    this.grid = new Grid('editDeviceGrid', {rowStyle: 'margin-bottom:15px'})
    await self.buildDeviceSettings()
    content.append(this.grid.render())
    self.dialog.setBody(content)
    self.dialog.open()
  }
}

export class PublishDevicesSettingsWizzard extends Wizzard {
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

    let publishButton = new Button('success', self.__('Finish'), (e, btn) => {
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
      title: self.__('Publishing settings'),
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
    this.status = new Label()
    let content = $('<div>').append(self.__('Here you can setup a new HomeKit instance. Please give your instance a nice name (eg. Roomname)'))
    content.append('<br /><br />')
    let table = new Table(content)
    let newInstance = {method: 'createinstance', publish: true}
    table.setColumns([{width: 150, label: ''}, ''])

    let inputName = new Input('instancename', '', (e, input) => {
      newInstance.name = input.value
    })
    inputName.setGroupLabel('HomeMatic_')

    table.addRow([self.__('Homekit instance name:'), inputName.render()])

    table.render()

    let finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if (newInstance.name) {
        self.status.setLabel(self.__('Creating instance ...'))
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
        self.status.setLabel(self.__('Please fill the name'))
      }
    }, true)

    self.dialog = new Dialog({
      dialogId: 'newhapinstance',
      buttons: [
        self.status,
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

export class EditHapInstanceWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.status = new Label()

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if ((self.hapInstanceData.displayName !== undefined) && (self.hapInstanceData.displayName.length > 0)) {
        self.status.setLabel(self.__('Updating instance ...'))
        self.finishButton.setActive(false)
        self.activitySpinner.setActive(true)
        self.dissmissButton.setActive(false)
        await self.application.makeApiRequest(self.hapInstanceData)
        setTimeout(() => {
          self.application.refreshBridges()
          self.dialog.close()
        }, 2000)
      } else {
        self.status.setLabel(self.__('Please fill the name'))
      }
    }, true)

    self.dialog = new Dialog({
      dialogId: 'editHAP',
      buttons: [
        self.status,
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
    let self = this

    let content = $('<div>').append(self.__('Edit HAP Instance'))
    content.append('<br /><br />')
    let table = new Table(content)
    let name = hapInstance.displayName
    if (name.indexOf('HomeMatic_') === 0) {
      name = name.replace('HomeMatic_', '')
    }
    this.hapInstanceData = {method: 'editinstance', publish: true, uuid: hapInstance.id, displayName: name}
    table.setColumns([{width: 150, label: ''}, ''])

    let inputName = new Input('instancedisplayName', this.hapInstanceData.displayName, (e, input) => {
      self.hapInstanceData.displayName = input.value
      if (input.value.length > 0) {
        self.finishButton.setActive(true)
      } else {
        self.finishButton.setActive(false)
      }
    })
    inputName.setGroupLabel('HomeMatic_')

    table.addRow([self.__('Homekit instance name:'), inputName.render()])

    table.render()
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class AbstractEditVaribleWizzard extends Wizzard {
  async buildVariableSettings () {
    var row = this.grid.addRow('varName')
    let self = this
    let inputName = new Input('variableNameInHomeKit', this.variableData.name, (e, input) => {
      self.variableData.name = input.value
      if (input.value.length > 0) {
        self.finishButton.setActive(true)
      } else {
        self.finishButton.setActive(false)
      }
    })
    inputName.setGroupLabel(self.__('HomeKit name:'))
    row.addCell(3, 12, this.__('HomeKit name:'))
    row.addCell(9, 12, inputName.render())

    let hapList = new Dropdown('newDeviceHapList', self.__('Select a instance'))
    self.application.getBridges().map(bridge => {
      if (bridge.id === self.variableData.instanceID) {
        hapList.setTitle(bridge.displayName)
      }
      hapList.addItem({
        title: bridge.displayName,
        value: bridge.id,
        onClick: (e, btn) => {
          self.variableData.instanceID = btn
        }
      })
    })

    row = this.grid.addRow('varInstance')
    row.addCell(3, 12, this.__('Instance'))
    row.addCell(9, 12, hapList.render())
  }
}

export class EditVariableWizzard extends AbstractEditVaribleWizzard {
  constructor (application) {
    super(application)
    let self = this
    this.status = new Label()

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if ((self.variableData.name !== undefined) && (self.variableData.name.length > 0)) {
        self.status.setLabel(self.__('Updating variable ...'))
        self.finishButton.setActive(false)
        self.activitySpinner.setActive(true)
        self.dissmissButton.setActive(false)
        await self.application.makeApiRequest(self.variableData)
        setTimeout(() => {
          self.application.refreshVariables()
          self.dialog.close()
        }, 2000)
      } else {
        self.status.setLabel(self.__('Please fill the name'))
      }
    }, true)

    self.dialog = new Dialog({
      dialogId: 'editVariable',
      buttons: [
        self.status,
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.__('Edit variable'),
      dialogClass: 'modal-info',
      scrollable: true
    })
  }

  run (variable) {
    let self = this

    let content = $('<div>').append(self.__('Edit variable'))
    content.append('<br /><br />')

    this.grid = new Grid('editVariableGrid', {rowStyle: 'margin-bottom:15px'})

    this.variableData = {method: 'saveVariable',
      serial: variable.serial,
      name: variable.name,
      instanceID: variable.instanceID
    }
    super.buildVariableSettings()
    content.append(this.grid.render())
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class NewVariableWizzard extends AbstractEditVaribleWizzard {
  constructor (application) {
    super(application)
    let self = this
    this.variableData = {
      method: 'saveVariable'
    }

    this.status = new Label()

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if (self.variableData.instanceID === undefined) {
        self.status.setLabel(self.__('Please choose a HAP instance'))
      } else {
        self.finishButton.setActive(false)
        self.activitySpinner.setActive(true)
        self.dissmissButton.setActive(false)
        await self.application.makeApiRequest(self.variableData)
        setTimeout(() => {
          self.application.refreshVariables()
          self.dialog.close()
        }, 2000)
      }
    }, false)

    self.dialog = new Dialog({
      dialogId: 'addNewVariable',
      buttons: [
        self.status,
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.__('Add new Variable'),
      dialogClass: 'modal-info',
      scrollable: true,
      size: 'modal-xl'
    })
  }

  showVariableSettings (variable) {
    let content = $('<div>').append(this.__('Setup variable'))
    content.append('<br /><br />')

    this.grid = new Grid('editVariableGrid', {rowStyle: 'margin-bottom:15px'})

    this.variableData = {method: 'saveVariable',
      serial: variable.name,
      name: variable.name,
      instanceID: variable.instanceID
    }
    super.buildVariableSettings()
    content.append(this.grid.render())
    this.finishButton.setActive(true)
    this.dialog.setBody(content)
  }

  run (variableList) {
    let content = $('<div>').append(this.__('New variable'))
    content.append('<br /><br />')
    let self = this
    let grid = new DatabaseGrid('newVarialeSelector', variableList, {})

    grid.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      if (element) {
        return (((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
              ((element.dpInfo) && (element.dpInfo.toLowerCase().indexOf(filter.toLowerCase()) > -1)))
      } else {
        return false
      }
    })

    grid.setTitleLabels([this.__('Variable'), this.__('Description')])

    grid.setColumns([
      {md: 5, lg: 12},
      {md: 5, lg: 12},
      {md: 2, lg: 12}
    ])

    grid.setRenderer((row, item) => {
      var selectButton
      if (self.application.getVariableBySerial(item.name)) {
        selectButton = new Button('secondary', self.__('allready here'), (e, btn) => {})
      } else {
        selectButton = new Button('info', self.__('Select'), (e, btn) => {
          self.showVariableSettings(item)
        })
      }
      selectButton.setStyle('width:100%')
      return ([item.name, item.dpInfo, selectButton.render()])
    })

    content.append(grid.render())
    this.dialog.setBody(content)
    this.dialog.open()
  }
}
