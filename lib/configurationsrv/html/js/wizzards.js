/*
 * File: wizzards.js
 * Project: hap-homematic
 * File Created: Thursday, 19th March 2020 4:40:43 pm
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

 import {Dialog, Button,
  Grid, DatabaseGrid,SelectInput,ButtonInput,
  Dropdown, Input, CheckBox, Spinner, Label} from './ui.js'

export class Wizzard {
  constructor (application) {
    this.application = application
    let self = this
    this.activitySpinner = new Spinner()
    this.dialogWasCanceld = true
    this.dissmissButton = new Button('light', self.__('Dismiss'), (e, btn) => {
      if (self.dialog) {
        self.dialogWasCanceld = true
        if (self.onClose) {
          self.onClose()
        }
        self.dialog.close()
      }
    }, true)
  }

  __ () {
    // this is crazy
    return this.application.__.apply(this.application, arguments)
  }

  setOnClose(onClose) {
    this.onClose = onClose
  }

  run () {
    if (this.dialog) {
      this.dialog.open()
    }
  }

  close () {
    if (this.dialog) {
      this.dialog.close()
    }
  }
}

export class FilterObjectDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.dissmissButton.setLabel(self.__('Cancel'))
    this.dialog = new Dialog({
      dialogId: 'selectorDialog',
      buttons: [
        self.dissmissButton
      ],
      title: self.__('Select'),
      dialogClass: 'modal-success',
      scrollable: true,
      size: 'modal-md'
    })
  }


  setListTitles (titles) {
    this.listTitles = titles
  }

  onSelect(fkt) {
    this.onSelect = fkt
  }

  run (id,objectList) {
    let self = this
    let content = $('<div>')
 
    this.grid = new DatabaseGrid(id + '_objectSelector', objectList, {maxPages: 4})

    this.grid.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      if (element) {
        return ((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1))
      } else {
        return false
      }
    })

    this.grid.setTitleLabels(this.listTitles)

    this.grid.setColumns([
      {sz: {sm: 6, md: 8, lg: 8}, sort: 0},
      {sz: {sm: 6, md: 4, lg: 4}}
    ])

    this.grid.sortCallback = (column, a, b) => {
      switch (column) {
        case 0:
          return a.name.localeCompare(b.name)
        case 1:
          return a.dpInfo.localeCompare(b.dpInfo)
        default:
          return true
      }
    }
    this.grid.columnSort = 0

    this.grid.setRenderer((row, item) => {
      var selectButton
        selectButton = new Button('info', self.__('Select'), (e, btn) => {
          if (self.onSelect) {
            self.onSelect(item.name)
          }
        })
      selectButton.setStyle('width:100%')
      return ([item.name, selectButton.render()])
    })

    content.append(this.grid.render())
    this.dialog.setBody(content)
    this.dialog.open()
  }
}


export class RebootUpdateDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.debug = false
    this.debugControl = new CheckBox('debug', false, (e, input) => {
      self.debug = input.checked
    })
    this.debugControl.setLabel(this.__('Enable debug at launch'))
    this.proceedButton = new Button('danger', self.__('YOLO'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      self.proceedButton.setActive(false)
      if (self.proceed) {
        self.proceed(self.debug)
      }
    }, true)
    this.dissmissButton.setLabel(self.__('Covfefe'))
    this.dialog = new Dialog({
      dialogId: 'updateRebootDialog',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        self.proceedButton
      ],
      title: self.__('Sure ?'),
      dialogClass: 'modal-danger',
      scrollable: true,
      size: 'modal-md'
    })
  }

  setProceedLabel (lbl) {
    this.proceedButton.setLabel(lbl)
  }

  setProceed (callback) {
    this.proceed = callback
  }

  run (message) {
    let content = $('<div>')
    content.append(message)
    content.append('<br /><br />')
    content.append(this.debugControl.render())
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class SelectTriggerDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.debug = false

    this.keyOptionList = new SelectInput('keys',self.__('Select a key'),(e,sel)=>{
      self.selectedKey = sel.value
    })

    this.proceedButton = new Button('info', self.__('Select'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      self.proceedButton.setActive(false)
      if (self.proceed) {
        self.proceed(self.selectedKey)
      }
      self.close()
    }, true)
    this.dissmissButton.setLabel(self.__('Cancel'))
    this.dialog = new Dialog({
      dialogId: 'selectTrigger',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        self.proceedButton
      ],
      title: self.__('Select a virtual key'),
      dialogClass: 'modal-info',
      scrollable: false,
      size: 'modal-md'
    })
  }

  setProceed (callback) {
    this.proceed = callback
  }

  setTrigger(trigger) {
    if (trigger) {
      this.keyOptionList.setValue(trigger)
      this.selectedKey = trigger
    }
  }

  setKeyList(list) {
    let self = this
    this.keyOptionList.setOptions(list)
  }

  run () {
    let content = $('<div>')
    content.append(this.__('Due to the fact, that your ccu will not sent a message to hap when a variable will change its value, we have to build a helper.'))
    content.append('<br />')
    content.append(this.__('HAP will use a virtual key from your CCU for that helper.'))
    content.append('<br />')
    content.append(this.__('This key will be monitored by HAP. So HAP is able to detect when its time to reload the variables.'))
    content.append('<br /><br />')
    content.append(this.keyOptionList.render())
    content.append('<br />')
    content.append(this.__('The program to manage all this can be build by HAP automatically. Just select the option after you have chosen a key.'))
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class BackupRestoreDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this


    let grid = new Grid('dialogGrid',{

    })


    this.fileInput = new Input('file', undefined, (e, input) => {
      self.restoreButton.setActive(true)
    })

    this.fileInput.setType('file')
    this.fileInput.setLabel(this.__('Backup file'))

    this.backupButton = new Button('success', self.__('Create Backup'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      self.restoreButton.setActive(false)
      self.backupButton.setActive(false)
      if (self.proceedBackup) {
        self.proceedBackup()
      }
    }, true)

    this.restoreButton = new Button('success', self.__('Restore'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      self.restoreButton.setActive(false)
      if (self.proceedRestore) {
        self.proceedRestore(self.fileInput.getFiles(0))
      }
    }, true)

    self.restoreButton.setActive(false)


    var row = grid.addRow('backup',{})
    row.addCell({md:7,sm:12,lg:7,xl:7},'')
    row.addCell({md:5,sm:12,lg:5,xl:5},this.backupButton.render())

    row = grid.addRow('sep',{})
    row.addCell({md:12,sm:12,lg:12,xl:12},'<hr />')

    row = grid.addRow('restore',{})
    row.addCell({md:7,sm:12,lg:7,xl:7},this.fileInput.render())
    row.addCell({md:5,sm:12,lg:5,xl:5},this.restoreButton.render())



    this.dissmissButton.setLabel(self.__('Covfefe'))
    this.dialog = new Dialog({
      dialogId: 'restoreDialog',
      buttons: [
        self.activitySpinner,
        self.dissmissButton
      ],
      title: self.__('Backup/Restore'),
      dialogClass: 'modal-info',
      scrollable: true,
      size: 'modal-md'
    })

    let content = $('<div>')
    content.append(grid.render())
    this.dialog.setBody(content)
    
  }
  
  setProceedRestore (callback) {
    this.proceedRestore = callback
  }
  
  setProceedBackup (callback) {
    this.proceedBackup = callback
  }

  run () {
    this.dialog.open()
  }
}

export class SupportDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    self.serial = ''
    self.inputName = new Input('deviceSerial', self.serial, (e, input) => {
      self.serial = input.value
    })

    self.inputName.setLabel(self.__('Device serial'))

    this.proceedButton = new Button('info', self.__('Download'), async (e, btn) => {
      self.proceedButton.setActive(false)
      if (self.proceed) {
        self.proceed(self.serial)
      }
    }, true)
    this.dissmissButton.setLabel(self.__('Close'))
    this.dialog = new Dialog({
      dialogId: 'supportDialog',
      buttons: [
        self.dissmissButton,
        self.proceedButton
      ],
      title: self.__('Request Support ...'),
      dialogClass: 'modal-info',
      scrollable: true,
      size: 'modal-md'
    })
  }

  setProceed (callback) {
    this.proceed = callback
  }

  run (message) {
    let content = $('<div>')
    content.append(this.__('If you want to add a devices you own, which is currently not supported, u may help the developer here.'))
    content.append('<br />')
    content.append(this.__('Please enter the serial number of your device. HAP-HomeMatic will create an anonymous file with all necessary information to add this device.'))
    content.append('<br /><br />')
    content.append(this.__('After that, please navigate to <a target="_blank" href="https://github.com/thkl/hap-homematic/issues/new/choose">Github Issues</a>, create an new issue and attach the downloaded file.'))
    content.append('<br /><br />')
    content.append(this.inputName.render())
    content.append('<br /><br />')
    content.append(this.__('For other issues, please open a request at <a target="_blank" href="https://github.com/thkl/hap-homematic/issues/new/choose">GitHub Issues</a>. Please make sure, <a href="https://github.com/thkl/hap-homematic/issues">your problem was not reported previously</a> '))
    content.append(this.__(' and is not <a target="_blank"  href="https://github.com/thkl/hap-homematic/issues?q=is%3Aissue+is%3Aclosed">already fixed</a>.'))
    content.append('<br /><br />')
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class SettingsDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    let settings = {}
    settings.useAuth = application.systemInfo.useAuth
    this.authControl = new CheckBox('useAuthentication', settings.useAuth, (e, input) => {
      settings.useAuth = input.checked
    })
    this.authControl.setLabel(self.__('Use CCU Authentication'))

    settings.useTLS = application.systemInfo.useTLS
    this.tlsControl = new CheckBox('useTLS', settings.useTLS, (e, input) => {
      settings.useTLS = input.checked
    })
    this.tlsControl.setLabel(self.__('Use HTTPS'))

    settings.enableMonitoring = application.systemInfo.enableMonitoring
    this.monitControl = new CheckBox('enableMonitoring', settings.enableMonitoring, (e, input) => {
      settings.enableMonitoring = input.checked
    })
    this.monitControl.setLabel(self.__('Enable Monitoring'))

    settings.disableHistory = application.systemInfo.disableHistory
    this.historyControl = new CheckBox('disableHistory', settings.disableHistory, (e, input) => {
      settings.disableHistory = input.checked
    })
    this.historyControl.setLabel(self.__('Apple Home Compatibility'))

    settings.forceCache = application.systemInfo.forceCache
    this.forceCacheControl = new CheckBox('forceCache', settings.forceCache, (e, input) => {
      settings.forceCache = input.checked
    })
    this.forceCacheControl.setLabel(self.__('Force Cache usage'))


    let proceedButton = new Button('info', self.__('Save'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      proceedButton.setActive(false)
      if (self.proceed) {
        self.proceed(settings)
      }
      self.dialog.close()
    }, true)

    this.dialog = new Dialog({
      dialogId: 'SettingsDialog',
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        proceedButton
      ],
      title: self.__('Settings'),
      dialogClass: 'modal-danger',
      scrollable: true,
      size: 'modal-md'
    })
  }

  setProceed (callback) {
    this.proceed = callback
  }

  run (message) {
    let content = $('<div>')
    content.append(message)
    content.append('<br />')
    content.append(this.authControl.render())
    content.append('<br />')
    content.append(this.tlsControl.render())
    content.append('<br />')
    content.append(this.monitControl.render())
    content.append('<br />')
    content.append(this.forceCacheControl.render())
    content.append('<br /><hr />')
    content.append(this.historyControl.render())
    content.append('<br />')
      
    content.append(
      this.__('This will disable the eve history. Due to the fact that Apples Home App is not able to show custom devices using this option will not generate custom devices.')
      )
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class InvalidCredentialsDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this

    this.dialog = new Dialog({
      dialogId: 'invalidCredentialDialog',
      buttons: [
        self.dissmissButton
      ],
      title: self.__('Invalid credentials'),
      dialogClass: 'modal-danger',
      scrollable: true,
      size: 'modal-md'
    })
  }

  run () {
    let content = $('<div>')
    content.append(this.__('U are not allowed to use this application. Please log in thru your ccu first.'))
    content.append('<br /><br />')
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class ResetInstanceDialog extends Wizzard {
  constructor (application) {
    super(application)
    let self = this

    let resetButton = new Button('danger', self.__('Yes, reset the instance'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      deleteButton.setActive(false)
      self.resetInstance()

      setTimeout(() => {
        self.dialog.close()
      }, 2000)
    }, true)

    this.dialog = new Dialog({
      dialogId: self.getDialogId(),
      buttons: [
        self.activitySpinner,
        self.dissmissButton,
        resetButton
      ],
      title: self.getTitle(),
      dialogClass: 'modal-danger',
      scrollable: true,
      size: 'modal-md'
    })
  }

  getDialogId () { return 'id' }
  getTitle () { return 'Reset ?' }

  async resetInstance () {
    await this.application.makeApiRequest({method: 'resetInstance', uuid: this.hapInstance.id})
    setTimeout(() => {
      self.application.refreshBridges()
      self.dialog.close()
    }, 2000)

  }

  run (hapInstance) {
    this.hapInstance = hapInstance
    this.dialog.setBody(this.__('Are you sure you want to reset %s? HomeKit will not be able to access devices in this instance anymore. You have to reconnect the instance new to HomeKit. All your settings, automations using devices from this instance will be lost. Only perfom this in case you removed a instance allready and now you are note able to add it again to HomeKit.', hapInstance.displayName))
    this.dialog.open()
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
    let self = this
    await this.application.makeApiRequest({method: 'removeDevice', uuid: this.device.UUID})
    setTimeout(() => {
      if (self.onExit) {
        self.onExit()
      } else {
        self.application.refreshAll()
      }
    }, 2000)
  }

  getDialogId () { return 'deleteDeviceDialog' }
  getTitle () { return this.__('Remove ...') }

  run (device) {
    this.device = device
    this.dialog.setBody(this.__('Are you sure you want to remove %s from HomeKit?', device.name))
    this.dialog.open()
  }
}

/** this is the dialog class for removing an hap instance */
export class DeleteHapInstanceWizzard extends DeleteItemWizzard {
  async deleteItem () {
    let self = this
    if (this.hapInstance.id !== 0) {
      await this.application.makeApiRequest({method: 'removehapinstance', id: this.hapInstance.id})
      setTimeout(() => {
        self.application.refreshBridges()
        self.dialog.close()
      }, 2000)
    }
  }

  getDialogId () { return 'deleteDeviceDialog' }
  getTitle () { return this.__('Remove ...') }

  run (hapInstance) {
    this.hapInstance = hapInstance
    this.dialog.setBody(this.__('Are you sure you want to remove %s? All your devices will be reassigned to the default Instance.', hapInstance.displayName))
    this.dialog.open()
  }
}

export class DeleteVariableWizzard extends DeleteItemWizzard {
  async deleteItem () {
    let self = this
    if (this.variable.serial !== undefined) {
      await this.application.makeApiRequest({method: 'removeVariable', serial: this.variable.nameInCCU, uuid: this.variable.UUID})
      setTimeout(() => {
        self.application.refreshVariables()
        self.dialog.close()
      }, 3000)
    }
  }

  getDialogId () { return 'deleteDeviceDialog' }
  getTitle () { return this.__('Remove ...') }

  run (variable) {
    this.variable = variable
    this.dialog.setBody(this.__('Are you sure you want to remove %s?', variable.name))
    this.dialog.open()
  }
}

export class DeleteProgramWizzard extends DeleteItemWizzard {
  async deleteItem () {
    let self = this
    if (this.program.serial !== undefined) {
      await this.application.makeApiRequest({method: 'removeProgram', serial: this.program.nameInCCU, uuid: this.program.UUID})
      setTimeout(() => {
        self.application.refreshPrograms()
        self.dialog.close()
      }, 3000)
    }
  }

  getDialogId () { return 'deleteProgramDialog' }
  getTitle () { return this.__('Remove ...') }

  run (program) {
    this.program = program
    this.dialog.setBody(this.__('Are you sure you want to remove %s?', program.name))
    this.dialog.open()
  }
}

// this is the Abstract Class used by edit and new Device Wizzard
export class AbstractEditSettingsWizzard extends Wizzard {

  addControlRow(rowID,label,control,hint) {
    let  row = this.grid.addRow(rowID)
    row.addCell({sm: 12, md: 2, lg: 2}, this.__(label || ''))
    row.addCell({sm: 12, md: (hint !== undefined) ? 7:10 , lg: (hint !== undefined) ? 5:10}, (control) ? control.render() : '')
    if (hint !== undefined) {
      row.addCell({sm: 12, md: 3, lg: 5}, this.__(hint || ''),null,'hint')
    }
    return row
  }

  buildTextControlField(template,settings,settingsKey,onChange) {
    let self = this
    let control
    if (template.selector) {
      control = new ButtonInput(settingsKey,  settings || template.default, self.__('Select'), async (e, input) => {
        if (onChange) {
          onChange(input.value)
        }
      }, async (e, input) => {
        switch (template.selector) {
          case 'variables': 
          let dlg = new FilterObjectDialog(self.application)
          dlg.onSelect((nVarN)=>{
            control.setValue(nVarN)
            dlg.close()
          })
          dlg.setListTitles([self.__('Variable')])
          let vars = await self.application.getAllVariables()
          dlg.run(template.selector,vars)
          break

          case 'datapoint':
          let dpDlg = new DatepointWizzard(self.application)
          dpDlg.onSelect = (item)=>{
            control.setValue(item)
          }
          dpDlg.run(template.options)
          break
          case 'channel':
          let chDlg = new ChannelWizzard(self.application)
          chDlg.onSelect = (item)=>{
            control.setValue(item.address)
          }
          chDlg.run(template.options)
          break

        }
       
      })
    } else {
      control = new Input(settingsKey, settings || template.default, (e, input) => {
        self.serviceSettings.settings[settingsKey] = input.value
      })
    }

    return control
  }

  async buildDeviceSettings () {
    let self = this
    var row
    self.grid.resetRows()

    let inputName = new Input('devicename', self.serviceSettings.name, (e, input) => {
      self.serviceSettings.name = input.value
    })

    let serviceDescription = new Label('serviceDescription')

    console.log('Getting Servicedata for %s', JSON.stringify(this.serviceSettings))
    let serviceList = await self.application.makeApiRequest({method: 'service', channelAddress: this.serviceSettings.address})

    let oServiceList = new Dropdown('newDeviceService', self.serviceSettings.serviceClass || '')
    serviceList.service.map(service => {
      // set the current template
      if (service.serviceClazz === self.serviceSettings.serviceClass) {
        self.serviceSettings.template = service.settings
        serviceDescription.setLabel(self.__(service.description))
      }
      oServiceList.addItem({
        title: service.serviceClazz,
        value: service.serviceClazz,
        onClick: async (e, btn) => {
          self.serviceSettings.serviceClass = btn
          self.serviceSettings.template = service.settings
          serviceDescription.setLabel(self.__(service.description))
          await self.buildDeviceSettings()
          self.grid.render()
        }
      })
    })
    // create a empty settings mapp
    if (self.serviceSettings.settings === undefined) {
      self.serviceSettings.settings = {}
    }
    // select the first service if there is none
    if ((self.serviceSettings.serviceClass === undefined) && (serviceList.service.length > 0)) {
      self.serviceSettings.serviceClass = serviceList.service[0].serviceClazz
      self.serviceSettings.template = serviceList.service[0].settings
      serviceDescription.setLabel(self.__(serviceList.service[0].description))
      oServiceList.setTitle(self.serviceSettings.serviceClass)
    }

    self.addControlRow('deviceName','Homekit Device name',inputName,'You may change the devicename as u like.')
    self.addControlRow('service','Service',oServiceList,'Select the service you want to use for this channel')
    self.addControlRow('description','Description',serviceDescription)
    
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

          case 'text_control_array':
            if (!settings) {
              settings = {'0':''}
            }
            Object.keys(settings).map((osk)=>{
              let oneSetting = settings[osk]
              control = self.buildTextControlField(template,oneSetting,settingsKey,(newValue)=>{
                settings[osk] = newValue    
                self.serviceSettings.settings[settingsKey] = settings 
                // fetch the channel name
                let selChannel = self.application.getChannelByAddress(newValue)
                let tHint = template.hint 
                if (selChannel) {
                  tHint = tHint + ' (' + selChannel.name + ')'
                }
                $('#editDeviceGrid_st_key_' + osk +'_hint').html(tHint)
              })

              let removeButton = new Button('danger',self.__('Remove'),async (e)=>{
                delete settings[osk]   
                self.serviceSettings.settings[settingsKey] = settings    
                await self.buildDeviceSettings()
                self.grid.render()
              })

              control.addButton(removeButton)
              let selChannel = self.application.getChannelByAddress(oneSetting)
              let tHint = template.hint 
              if (selChannel) {
                tHint = tHint + ' (' + selChannel.name + ')'
              }
              row = self.addControlRow('st_' + settingsKey + '_' + osk,template.label,control,tHint) 
            })

            self.addControlRow('st_newChannel' + settingsKey ,'',new Button('info',self.__('Add new channel'), async (e)=>{
              let ids = Object.keys(settings)
              let lastID = parseInt(ids[ids.length-1])
              settings[lastID+1] = ""
              await self.buildDeviceSettings()
              self.grid.render()

            })) 

            control = undefined // prevent from adding the last one again
            break
          case 'text':

            control = self.buildTextControlField(template,settings,settingsKey,(newValue)=>{
              self.serviceSettings.settings[settingsKey] = newValue
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
        if ((!self.serviceSettings.settings[settingsKey]) && (template.default)) {
          self.serviceSettings.settings[settingsKey] = template.default
        }
        if (control) {
          self.addControlRow('st_' + settingsKey,template.label,control,template.hint) 
        }
      })
    }
    let instances = 0
    Object.keys(self.serviceSettings.instanceIDs).map((instanceIDKey) => {
      let instanceID = self.serviceSettings.instanceIDs[instanceIDKey]
      instances += 1
      let hapList = new Dropdown('newDeviceHapList', self.__('Select a instance'))
      self.application.getBridges().map(bridge => {
        if (bridge.id === instanceID) {
          hapList.setTitle(bridge.displayName)
        }
        hapList.addItem({
          title: bridge.displayName,
          value: bridge.id,
          onClick: (e, btn) => {
            self.serviceSettings.instanceIDs[instanceIDKey] = btn
         }
        })
      })
    
    row = self.grid.addRow('hapInstance')
    
    let desc = self.__('Select the HAP Instance to which you want to add this channel')

    if (instances > 1) {
      let removeButton = new Button('light', self.__('Remove'), async (e, btn) => {
        delete self.serviceSettings.instanceIDs[instanceIDKey]
        await self.buildDeviceSettings()
        self.grid.render()
      }, true)
      desc = removeButton.render()
    }
   
    row.addCell({sm: 12, md: 2, lg: 2}, self.__('HAP Instance'))
    row.addCell({sm: 12, md: 5, lg: 5}, hapList.render())
    row.addCell({sm: 12, md: 5, lg: 5}, desc)
    
  })
  let addNewInstanceButton= new Button('light', self.__('Add to another instance'), async (e, btn) => {
    self.serviceSettings.instanceIDs[(instances + 1)] = 0
    await self.buildDeviceSettings()
    self.grid.render()
  }, true)
  row = self.grid.addRow('newHapInstance')
  row.addCell({sm: 12, md: 2, lg: 2}, '')
  row.addCell({sm: 12, md: 5, lg: 5}, addNewInstanceButton.render())
  row.addCell({sm: 12, md: 5, lg: 5}, '')

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
      if ((self.serviceSettings.instanceIDs === undefined) || (self.serviceSettings.instanceIDs[0] === undefined)){
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
      scrollable: false,
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

    let grid = new DatabaseGrid('ndevices', dataset, {})

    grid.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      if (element.length > 1) {
        return (((element[0].name) && (element[0].name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
              ((element[1].name) && (element[1].name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
              ((element[1].address) && (element[1].address.toLowerCase().indexOf(filter.toLowerCase()) > -1))
              )
      } else {
        return false
      }
    })

    grid.setTitleLabels([self.__('Device'), self.__('Type'), self.__('Channel'), self.__('Type')])

    grid.setColumns([
      {sz: {sm: 6, md: 2, lg: 2}, sort: 0},
      {sz: {sm: 6, md: 2, lg: 2}, sort: 1},
      {sz: {sm: 6, md: 3, lg: 3}, sort: 2},
      {sz: {sm: 6, md: 3, lg: 3}, sort: 3},
      {sz: {sm: 6, md: 2, lg: 2}}
    ])

    grid.sortCallback = (column, a, b) => {
      let deviceA = a[0]
      let channelA = a[1]

      let deviceB = b[0]
      let channelB = b[1]

      switch (column) {
        case 0:
          return deviceA.name.localeCompare(deviceB.name)
        case 1:
          return deviceA.type.localeCompare(deviceB.type)
        case 2:
          return channelA.name.localeCompare(channelB.name)
        case 3:
          return channelA.type.localeCompare(channelB.type)
        default:
          return true
      }
    }
    grid.columnSort = 0

    grid.setRenderer((row, item) => {
      let result = []
      let device = item[0]
      let channel = item[1]

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
          let hapInstance = self.application.getPredictedHapInstanceForChannel(channel)
          
          self.serviceSettings.instanceIDs = (hapInstance) ? {0:hapInstance.id} : {0:undefined}
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

    content.append(grid.render())

    self.dialog.setBody(content)
    self.dialog.open()
  }

  async createNewDevice () {
    let self = this
    if ((self.serviceSettings.instanceIDs !== undefined) && (self.serviceSettings.instanceIDs[0] !== undefined)){
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
        if (self.onExit) {
          self.onExit()
        } else {
          self.application.refreshAll()
        }
        self.dialog.close()
      }, 2000)
    }
  }
}

export class EditDeviceWizzard extends AbstractEditSettingsWizzard {
  constructor (application) {
    super(application)
    let self = this
    this.statusLabel = new Label()
    let publishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      publishButton.setActive(false)
      let saveResult = await self.saveDevice()
      if (saveResult === true) {
        setTimeout(() => {
          if (self.onExit) {
            self.onExit()
          } else {
            self.application.refreshAll()
          }
          self.dialogWasCanceld = false
          self.dialog.close()
        }, 2000)
      } else {
        self.activitySpinner.setActive(false)
        self.dissmissButton.setActive(true)
        publishButton.setActive(true)
      }
    }, true)

    self.dialog = new Dialog({
      dialogId: 'editDevice',
      buttons: [
        self.statusLabel,
        self.activitySpinner,
        self.dissmissButton,
        publishButton
      ],
      title: self.__('Edit device'),
      dialogClass: 'modal-info',
      scrollable: false,
      size: 'modal-xl'
    })

    this.sanityCheckFunction = (template, settings) => {
      var result = true
      Object.keys(template).map(key => {
        let st = template[key]
        if ((st.mandatory !== undefined) && (st.mandatory === true) && (settings[key] === undefined)) {
          result = false
        }
      })
      return result
    }
  }

  sanityCheck (check) {
    this.sanityCheckFunction = check
  }

  saveDevice () {
    return new Promise(async (resolve, reject) => {
      let settings = this.serviceSettings.settings
      settings.instanceIDs = this.serviceSettings.instanceIDs
      let self = this
      var canSave = true
      if (this.sanityCheckFunction) {
        let result = this.sanityCheckFunction(this.serviceSettings.template, settings)
        if (result === false) {
          self.statusLabel.setLabel(self.__('Some mandatory fields are missing'))
          canSave = false
          resolve(false)
        }
      }

      if (canSave === true) {
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
        self.statusLabel.setLabel(self.__('Proceeding ...'))
        await this.application.makeApiRequest(this.serviceSettings)
        // Save the canged data back to the local 
        this.device.settings = JSON.parse(JSON.stringify(this.workingCopy)) 
        await this.application.publish()
        resolve(true)
      }
    })
  }

  async run (device) {
    let self = this
    let instanceIDs = {}
    let instanceIDKey = 0
    this.device = device
    try {
      this.workingCopy = JSON.parse(JSON.stringify(device)) // this is ridicoulus
    } catch (e) {
      console.log('unable to create working copy for device')
    }

    if ((this.workingCopy.settings.instance) && (typeof this.workingCopy.settings.instance !== 'string')) {
      this.workingCopy.settings.instance.map((instance)=>{
        instanceIDs[instanceIDKey] = instance
        instanceIDKey += 1
      })
    } else {
      instanceIDs[0] = this.workingCopy.instanceID
    }
    this.serviceSettings = {
      method: 'saveDevice',
      name: this.workingCopy.name,
      address: this.workingCopy.serial + ':' + this.workingCopy.channel,
      instanceIDs: instanceIDs,
      serviceClass: this.workingCopy.serviceClass,
      settings: this.workingCopy.settings.settings, // this will blow my mind
      uuid: this.workingCopy.UUID}
    let content = $('<div>').append(self.__('Edit your device %s here', this.workingCopy.name))
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
    this.grid = new Grid('newHAP', {rowStyle: 'margin-bottom:15px'})

    let newInstance = {method: 'createinstance', publish: true}
    var row = this.grid.addRow('instRow')

    let inputName = new Input('instancename', '', (e, input) => {
      newInstance.name = input.value
    })
    inputName.setGroupLabel('HomeMatic ')

    row.addCell({sm: 12, md: 3, lg: 3}, this.__('Homekit instance name:'))
    row.addCell({sm: 12, md: 9, lg: 9}, inputName.render())

    row = this.grid.addRow('roomRow')
    let ccuRoomList = this.application.getRooms()
    let oRoomList = new Dropdown('newInstanceRoom', this.__('Select a room'))
    ccuRoomList.map(room => {
      // set the current template
      oRoomList.addItem({
        title: room.name,
        value: room.id,
        onClick: async (e, btn) => {
          newInstance.roomId = btn
        }
      })
    })

    row.addCell({sm: 12, md: 3, lg: 3}, this.__('HomeMatic assigned room:'))
    row.addCell({sm: 12, md: 9, lg: 9}, oRoomList.render())

    content.append(this.grid.render())
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

    self.resetButton = new Button('danger', self.__('Reset Instance'), async(b,btn)=>{
      let rd = new ResetInstanceDialog(self.application)
      rd.run(self.hapInstance)
      self.dialog.close()
    })

    self.dialog = new Dialog({
      dialogId: 'editHAP',
      buttons: [
        self.resetButton,
        self.status,
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.__('Edit Homekit instance'),
      dialogClass: 'modal-info',
      scrollable: false,
      size: 'modal-xl'
    })
  }

  run (hapInstance) {
    let self = this
    this.hapInstance = hapInstance

    let content = $('<div>').append(self.__('Edit HAP Instance'))
    content.append('<br /><br />')
    let grid = new Grid('editHAP', {rowStyle: 'margin-bottom:15px'})

    let name = hapInstance.displayName
    if (name.indexOf('HomeMatic ') === 0) {
      name = name.replace('HomeMatic ', '')
    }
    this.hapInstanceData = {method: 'editinstance', publish: true, uuid: hapInstance.id, displayName: name, roomId: hapInstance.roomId}

    let inputName = new Input('instancedisplayName', this.hapInstanceData.displayName, (e, input) => {
      self.hapInstanceData.displayName = input.value
      if (input.value.length > 0) {
        self.finishButton.setActive(true)
      } else {
        self.finishButton.setActive(false)
      }
    })
    inputName.setGroupLabel('HomeMatic  ')
    var row = grid.addRow('instRow')
    row.addCell({sm: 12, md: 3, lg: 3}, this.__('Homekit instance name:'))
    row.addCell({sm: 12, md: 9, lg: 9}, inputName.render())

    row = grid.addRow('roomRow')
    let ccuRoomList = this.application.getRooms()
    let oRoomList = new Dropdown('newInstanceRoom', this.__('Select a room'))
    ccuRoomList.map(room => {
      if (room.id === self.hapInstanceData.roomId) {
        oRoomList.setTitle(room.name)
      }

      oRoomList.addItem({
        title: room.name,
        value: room.id,
        onClick: async (e, btn) => {
          self.hapInstanceData.roomId = parseInt(btn)
        }
      })
    })

    row.addCell({sm: 12, md: 3, lg: 3}, this.__('HomeMatic assigned room:'))
    row.addCell({sm: 12, md: 9, lg: 9}, oRoomList.render())

    content.append(grid.render())
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class DeactivateInstanceWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.status = new Label()

    self.finishButton = new Button('success', self.__('Deactivate'), async (e, btn) => {
      self.status.setLabel(self.__('Deactivating instance ...'))
      self.finishButton.setActive(false)
      self.activitySpinner.setActive(true)
      self.dissmissButton.setActive(false)
      await self.application.makeApiRequest(self.hapInstanceData)
      setTimeout(() => {
        self.application.refreshBridges()
        self.dialog.close()
      }, 2000)
    }, true)

    self.dialog = new Dialog({
      dialogId: 'deactivateHAP',
      buttons: [
        self.status,
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.__('Deactivate Homekit instance'),
      dialogClass: 'modal-info',
      scrollable: false
    })
  }

  run (hapInstance) {
    let self = this

    let content = $('<div>').append(self.__('Deactivate Homekit instance'))
    content.append('<br /><br />')

    let name = hapInstance.displayName
    this.hapInstanceData = {method: 'deactivateInstance', uuid: hapInstance.id}
    content.append(self.__('If you deactivate a instance all devices in this instance will be removed from Homekit.'))
    content.append('<br />')
    content.append(self.__('The devices will stay in your configuration so they will appear again in Homekit when you activate the instance again.'))
    content.append(self.__('Use this feature to move a instance to another home without the need to assing all devices to a new room.'))
    content.append(self.__('To do this deactivate the instance, remove it from homekit, add it to a new Home, assign a room and activate the instance again.'))
    content.append('<br />')
    content.append(self.__('To activate the instance again just set the checkmark in Publishing settings.'))
    content.append('<br /><br />')
    content.append(self.__('To you want to deactivate %s', name))

    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class AbstractEditObjectWizzard extends Wizzard {
  async buildObjectSettingsUI () {
    this.grid.resetRows()
    var row = this.grid.addRow('objName')
    let self = this
    let inputName = new Input('objNameInHomeKit', this.objectData.name, (e, input) => {
      self.objectData.name = input.value
      if (input.value.length > 0) {
        self.finishButton.setActive(true)
      } else {
        self.finishButton.setActive(false)
      }
    })
    inputName.setGroupLabel(self.__('HomeKit name:'))
    row.addCell({sm: 12, md: 3, lg: 3}, this.__('HomeKit name:'))
    row.addCell({sm: 12, md: 9, lg: 9}, inputName.render())
   

    if (self.objectData.settings === undefined) {
      self.objectData.settings = {}
    }

    if (this.services) {
      let serviceList = new Dropdown('newObjectServiceList', self.__('Select a service'))
      self.services.map(service => {
        if (service.serviceClazz === self.objectData.serviceClass) {
          serviceList.setTitle(service.serviceClazz)
          self.objectData.template = service.settings
        }
        serviceList.addItem({
          title: service.serviceClazz,
          value: service.serviceClazz,
          onClick: async (e, btn) => {
            self.objectData.serviceClass = btn
            self.objectData.template = service.settings
            await self.buildObjectSettingsUI()
            self.grid.render()
          }
        })
      })

      row = this.grid.addRow('objService')
      row.addCell({sm: 12, md: 3}, this.__('Service'))
      row.addCell({sm: 12, md: 9}, serviceList.render())
    }

    let hapList = new Dropdown('newObjectHapList', self.__('Select a instance'))
    self.application.getBridges().map(bridge => {
      if (bridge.id === self.objectData.instanceID) {
        hapList.setTitle(bridge.displayName)
      }
      hapList.addItem({
        title: bridge.displayName,
        value: bridge.id,
        onClick: (e, btn) => {
          self.objectData.instanceID = btn
        }
      })
    })

    row = this.grid.addRow('objInstance')
    row.addCell({sm: 12, md: 3}, this.__('Instance'))
    row.addCell({sm: 12, md: 9}, hapList.render())

    if (this.objectData.template) {
      Object.keys(this.objectData.template).map(settingsKey => {
        let template = self.objectData.template[settingsKey]
        let settings = self.objectData.settings[settingsKey]
        var control
        switch (template.type) {
          case 'option':
            control = new Dropdown(settingsKey, settings || template.default)
            template.array.map(item => {
              control.addItem({
                title: item,
                value: item,
                onClick: (e, btn) => {
                  self.objectData.settings[settingsKey] = btn
                }
              })
            })
            break

          case 'number':
            control = new Input(settingsKey, parseInt(settings) || parseInt(template.default), (e, input) => {
              self.objectData.settings[settingsKey] = parseInt(input.value)
            })
            break

          case 'text':
            control = new Input(settingsKey, settings || template.default, (e, input) => {
              self.objectData.settings[settingsKey] = input.value
            })
            break

          case 'checkbox':
            control = new CheckBox(settingsKey, true, (e, input) => {
              self.objectData.settings[settingsKey] = input.checked
            })
            control.setValue(settings || template.default)
            break

          default:
            break
        }
        if ((!self.objectData.settings[settingsKey]) && (template.default)) {
          self.objectData.settings[settingsKey] = template.default
        }
        row = self.grid.addRow('st_' + settingsKey)
        row.addCell({sm: 12, md: 3, lg: 3}, self.__(template.label || ''))
        row.addCell({sm: 12, md: 4, lg: 4}, (control) ? control.render() : '')
        row.addCell({sm: 12, md: 5, lg: 5}, self.__(template.hint || ''))
      })
    }
  }
}

export class EditObjectWizzard extends AbstractEditObjectWizzard {
  constructor (application, dialogTitle) {
    super(application)
    let self = this
    this.status = new Label()
    this.dialogTitle = dialogTitle

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if ((self.objectData.name !== undefined) && (self.objectData.name.length > 0)) {
        self.status.setLabel(self.__('Updating object ...'))
        self.finishButton.setActive(false)
        self.activitySpinner.setActive(true)
        self.dissmissButton.setActive(false)
        if (self.willSave) {
          self.willSave(self)
        }
        await self.application.makeApiRequest(self.objectData)
        setTimeout(() => {
          if (self.onClose) {
            self.onClose(self)
          }
          self.dialog.close()
        }, 2000)
      } else {
        self.status.setLabel(self.__('Please fill the name'))
      }
    }, true)

    self.dialog = new Dialog({
      dialogId: 'editObject',
      buttons: [
        self.status,
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.dialogTitle,
      dialogClass: 'modal-info',
      scrollable: false
    })
  }

  onClose (callback) {
    this.onClose = callback
  }

  willSave (callback) {
    this.willSave = callback
  }

  setServices (services) {
    this.services = services
  }

  run (object) {
    let self = this

    let content = $('<div>').append(self.dialogTitle)
    content.append('<br /><br />')

    this.grid = new Grid('editObjectGrid', {rowStyle: 'margin-bottom:15px'})
    this.objectData = {
      serial: object.nameInCCU,
      name: object.name,
      serviceClass: object.serviceClass,
      instanceID: object.instanceID,
      settings: object.settings.settings // this will blow my mind
    }
    super.buildObjectSettingsUI()
    content.append(this.grid.render())
    this.dialog.setBody(content)
    this.dialog.open()
  }
}

export class NewObjectWizzard extends AbstractEditObjectWizzard {
  constructor (application, dialogTitle, propertyTitle) {
    super(application)
    let self = this
    this.objectData = {}
    this.status = new Label()
    this.dialogTitle = dialogTitle
    this.propertyTitle = propertyTitle

    self.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      if (self.objectData.instanceID === undefined) {
        self.status.setLabel(self.__('Please choose a HAP instance'))
      } else {
        self.finishButton.setActive(false)
        self.activitySpinner.setActive(true)
        self.dissmissButton.setActive(false)

        if (self.willSave) {
          self.willSave(self)
        }

        await self.application.makeApiRequest(self.objectData)
        setTimeout(() => {
          if (self.onClose) {
            self.onClose(self)
          }
          // self.application.refreshVariables()
          self.dialog.close()
        }, 2000)
      }
    }, false)

    self.dialog = new Dialog({
      dialogId: 'addNewObject',
      buttons: [
        self.status,
        self.activitySpinner,
        self.dissmissButton,
        self.finishButton
      ],
      title: self.dialogTitle,
      dialogClass: 'modal-info',
      scrollable: false,
      size: 'modal-xl'
    })
  }

  onClose (callback) {
    this.onClose = callback
  }

  willSave (callback) {
    this.willSave = callback
  }

  checkObjectIsMapped (callback) {
    this.objectIsMappedCheck = callback
  }

  setListTitles (titles) {
    this.listTitles = titles
  }

  setServices (services) {
    this.services = services
  }

  showObjectSettings (object, title) {
    let content = $('<div>').append(title)
    content.append('<br /><br />')

    this.grid = new Grid('editVariableGrid', {rowStyle: 'margin-bottom:15px'})

    this.objectData = {method: 'saveVariable',
      serial: object.name,
      name: object.name,
      instanceID: object.instanceID,
      serviceClass: object.serviceClass
    }
    super.buildObjectSettingsUI()
    content.append(this.grid.render())
    this.finishButton.setActive(true)
    this.dialog.setBody(content)
  }

  run (objectList) {
    let self = this
    let content = $('<div>').append(self.dialogTitle)
    content.append('<br /><br />')
    let grid = new DatabaseGrid('newObjectSelector', objectList, {maxPages: 4})

    grid.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      if (element) {
        return (((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1)) ||
              ((element.dpInfo) && (element.dpInfo.toLowerCase().indexOf(filter.toLowerCase()) > -1)))
      } else {
        return false
      }
    })

    grid.setTitleLabels(this.listTitles)

    grid.setColumns([
      {sz: {sm: 6, md: 5, lg: 5}, sort: 0},
      {sz: {sm: 6, md: 5, lg: 5}, sort: 1},
      {sz: {sm: 6, md: 2, lg: 2}}
    ])

    grid.sortCallback = (column, a, b) => {
      switch (column) {
        case 0:
          return a.name.localeCompare(b.name)
        case 1:
          return a.dpInfo.localeCompare(b.dpInfo)
        default:
          return true
      }
    }
    grid.columnSort = 0

    grid.setRenderer((row, item) => {
      var selectButton
      if (self.objectIsMappedCheck(item)) {
        selectButton = new Button('secondary', self.__('allready here'), (e, btn) => {})
      } else {
        selectButton = new Button('info', self.__('Select'), (e, btn) => {
          self.showObjectSettings(item)
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

export class ChannelWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.mode = 1
    this.status = new Label()

    this.backButton = new Button('light', self.__('Back'), (e, btn) => {
     if (self.mode === 2) {
      self.showDeviceList()
     }
     if (self.mode === 3) {
       self.showChannelList()
     }
    }, true)
    
    this.content = $('<div>')

    this.grid = new DatabaseGrid( '_objectSelector', undefined, {maxPages: 4})

    this.grid.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      if (element) {
        return ((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1))
      } else {
        return false
      }
    })


    this.dialog = new Dialog({
      dialogId: 'dpsearch',
      buttons: [
        self.status,
        self.backButton,
        self.dissmissButton
      ],
      title: self.__('Select a datapoint'),
      dialogClass: 'modal-success'
    })
  }



async showDeviceList() {
    let self = this
    this.grid.setTitleLabels(['Device',''])
    // Filter DeviceList
    self.mode = 1
    let fDs = this.application.ccuDevices.filter( (element)=>{
      let result = false
      element.channels.map((channel) => {
        if (self.options.filterChannels.indexOf(channel.type)>-1) {
          result = true
        }
      })
      return result
    })

    this.grid.setDataset(fDs)

    this.grid.setColumns([
      {sz: {sm: 6, md: 8, lg: 8}, sort: 0},
      {sz: {sm: 6, md: 4, lg: 4}}
    ])

    this.grid.sortCallback = (column, a, b) => {
      switch (column) {
        case 0:
          return a.name.localeCompare(b.name)
        case 1:
          return a.dpInfo.localeCompare(b.dpInfo)
        default:
          return true
      }
    }
    this.grid.columnSort = 0

    this.grid.setRenderer((row, item) => {
      var selectButton
        selectButton = new Button('info', self.__('Select'), (e, btn) => {
          self.selectedDevice = item
          self.mode = 2
          setTimeout(()=>{
            self.showChannelList()
          },200)
        })
      selectButton.setStyle('width:100%')
      return ([item.name, selectButton.render()])
    })
    this.grid.refresh()
  }


  async showChannelList() {
    let self = this
    this.grid.resetSearch()
    this.grid.setTitleLabels(['Channel',''])
    // Filter 
    let fDC = this.selectedDevice.channels.filter((element)=>{
      return (self.options.filterChannels.indexOf(element.type)>-1)
    })
    self.mode = 2
  

    this.grid.sortCallback = (column, a, b) => {
      switch (column) {
        case 0:
          return a.name.localeCompare(b.name)
        case 1:
          return a.dpInfo.localeCompare(b.dpInfo)
        default:
          return true
      }
    }
    this.grid.columnSort = 0
    this.grid.setDataset(fDC)
    this.grid.setColumns([
      {sz: {sm: 6, md: 8, lg: 8}, sort: 0},
      {sz: {sm: 6, md: 4, lg: 4}}
    ])
    this.grid.setRenderer((row, item) => {
      var selectButton
        selectButton = new Button('info', self.__('Select'), async (e, btn) => {
          self.selectedChannel = item
          self.channelSelectionCompleted()
        })
      selectButton.setStyle('width:100%')
      return ([item.name, selectButton.render()])
    })
    this.grid.refresh()

  }

  channelSelectionCompleted() {
    if (this.onSelect) {
      this.onSelect(this.selectedChannel)
      this.close()
    }
  }

  showDatapointList(dpList) {
    let self = this
    this.grid.resetSearch()
    this.grid.setTitleLabels(['DataPoint',''])

    this.grid.sortCallback = (column, a, b) => {
      switch (column) {
        case 0:
          return a.localeCompare(b)
        default:
          return true
      }
    }

    this.grid.columnSort = 0

    this.grid.setDataset(dpList)
    this.grid.setColumns([
      {sz: {sm: 6, md: 8, lg: 8}, sort: 0},
      {sz: {sm: 6, md: 4, lg: 4}}
    ])


    this.grid.setRenderer((row, item) => {
      var selectButton
        selectButton = new Button('info', self.__('Select'), async (e, btn) => {
          if (self.onSelect) {
            self.onSelect(item)
            self.close()
          }
        })
      selectButton.setStyle('width:100%')
      return ([item, selectButton.render()])
    })
    this.grid.refresh()

  }

  run(options) {
    this.options = options
    this.content.empty()
    this.content.append(this.grid.render())
    this.showDeviceList()
    this.dialog.setBody(this.content)
    this.dialog.open()
  }

}

export class DatepointWizzard extends ChannelWizzard {
  constructor (application) {
    super(application)
    let self = this
    this.mode = 1
    this.status = new Label()

    this.backButton = new Button('light', self.__('Back'), (e, btn) => {
     if (self.mode === 2) {
      self.showDeviceList()
     }
     if (self.mode === 3) {
       self.showChannelList()
     }
    }, true)
    
    this.content = $('<div>')

    this.grid = new DatabaseGrid( '_objectSelector', undefined, {maxPages: 4})

    this.grid.addSearchBar(self.__('Search'), self.__('Clear'), (element, filter) => {
      if (element) {
        return ((element.name) && (element.name.toLowerCase().indexOf(filter.toLowerCase()) > -1))
      } else {
        return false
      }
    })


    this.dialog = new Dialog({
      dialogId: 'dpsearch',
      buttons: [
        self.status,
        self.backButton,
        self.dissmissButton
      ],
      title: self.__('Select a datapoint'),
      dialogClass: 'modal-success'
    })
  }

  async channelSelectionCompleted() {
 
    this.mode = 3
    let item = this.selectedChannel
    let dps = await this.application.makeApiRequest({method: 'ccuGetDatapoints','cid':item.id})
    if (dps.datapoints) {
      let result = []
      dps.datapoints.map((dp)=>{
        result.push({name:dp})
      })
      this.showDatapointList(result)
    }
  }

  showDatapointList(dpList) {
    let self = this
    this.grid.resetSearch()
    this.grid.setTitleLabels(['DataPoint',''])

    this.grid.sortCallback = (column, a, b) => {
      switch (column) {
        case 0:
          return a.name.localeCompare(b.name)
        default:
          return true
      }
    }

    this.grid.columnSort = 0

    this.grid.setDataset(dpList)
    this.grid.setColumns([
      {sz: {sm: 6, md: 8, lg: 8}, sort: 0},
      {sz: {sm: 6, md: 4, lg: 4}}
    ])

    this.grid.setRenderer((row, item) => {
      var selectButton
        selectButton = new Button('info', self.__('Select'), async (e, btn) => {
          if (self.onSelect) {
            self.onSelect(item.name)
            self.close()
          }
        })
      selectButton.setStyle('width:100%')
      return ([item.name, selectButton.render()])
    })
    this.grid.refresh()

  }

}