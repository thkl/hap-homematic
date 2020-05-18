/*
 * File: welcomewizzard.js
 * Project: hap-homematic
 * File Created: Friday, 27th March 2020 5:44:00 pm
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
  DatabaseGrid,
  Input, CheckBox, Label} from './ui.js'

import {Wizzard} from './wizzards.js'

export class WelcomeWizzard extends Wizzard {
  constructor (application) {
    super(application)
    let self = this
    this.status = new Label()
    this.finishButton = new Button('success', self.__('Finish'), async (e, btn) => {
      self.application.refreshAll()
      self.dialog.close()
    }, false)

    this.nextButton = new Button('info', self.__('Next'), async (e, btn) => {
      self.finishStep(self.step)
    }, true)

    self.dialog = new Dialog({
      dialogId: 'newhapinstance',
      buttons: [
        self.status,
        self.activitySpinner,
        self.dissmissButton,
        self.nextButton,
        self.finishButton
      ],
      title: self.__('Welcome'),
      dialogClass: 'modal-info',
      size: 'modal-xl'
    })
  }

  createPage1 () {
    let self = this
    this.step = 1
    let content = $('<div>').append(self.__('<h2>Welcome to HAP-HomeMatic.</h2><br />With HAP-HomeMatic you are able to use your HomeMatic devices (or most of it) in HomeKit.'))
    content.append('<br /><br />')
    content.append(self.__('Its time for the first setup.<br />In HomeKit your are able to group your devices by rooms. And to make that as easy as possible for you, its recomented to create a HAP Instance for every room first.'))
    content.append('<br /><br />')
    content.append(self.__('So here are your rooms from your CCU. Please mark every room from which you want to use devices in HomeKit.'))
    content.append('<br /><br />')
    this.instancesToCreate = {}
    let grid = new DatabaseGrid('rooms', this.roomDeviceList, {rowStyle: 'margin-bottom:5px'})

    grid.setTitleLabels([self.__('CCU Room') + '<br />' + self.__('(Num o supported devices)'), self.__('Create HomeKit instance'), self.__('Instance name')])

    grid.setColumns([
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 5, lg: 5, xl: 5}}
    ])

    grid.setRenderer((row, room) => {
      self.instancesToCreate[room.id] = {roomID: room.id, name: room.name, create: false}
      let checkBox = new CheckBox('create_' + room.id, false, (e, input) => {
        self.instancesToCreate[room.id].create = input.checked
      })
      let inputName = new Input('instancename_' + room.id, room.name, (e, input) => {
        self.instancesToCreate[room.id].name = input.value
      })
      inputName.setGroupLabel('HomeMatic ')
      return ([room.name + ' (' + room.devices.length + ')', checkBox.render(), inputName.render()])
    })

    content.append(grid.render())
    content.append(self.__('You may add more rooms/instances later on.'))

    this.dialog.setBody(content)
  }

  createPage2 () {
    let self = this
    this.step = 3
    let content = $('<div>').append(self.__('Great! Step 2: Here are the new bridges just created. Now its time to add them to HomeKit. Use the HomeKit App of your choice and add them one by one.'))
    content.append('<br /><br />')
    content.append(self.__('During the setup in HomeKit you can assign a specific room to every bridge. All new devices added to a bridge will then automatically be assigned to this room.'))
    content.append('<br />')
    content.append(self.__('Please make sure, the given port for the bridge is not blocked by the firewall of your ccu.'))
    content.append('<br />')
    content.append(self.__('If you are using Apples Home App please tap after adding the bridge on the house icon top left, choose Home Settings, tap on your home and there you are able to setup the rooms for the bridges. This is tricky, so its recomented to use eg Elgato Eve.'))
    content.append('<br /><br />')
    let grid = new DatabaseGrid('instances', this.application.getBridges(), {rowStyle: 'margin-bottom:5px'})
    grid.setTitleLabels([self.__('Instance name'), self.__('Pin Code'), 'Port', self.__('CCU Room')])
    grid.setColumns([
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
      {sz: {sm: 6, md: 1, lg: 1, xl: 1}},
      {sz: {sm: 6, md: 4, lg: 4, xl: 4}}
    ])
    grid.setRenderer((row, bridge) => {
      let room = self.application.getRoombyId(bridge.roomId)
      let ccuRoomName = (room) ? room.name : '-'
      return ([bridge.displayName, bridge.pincode, bridge.port, ccuRoomName])
    })

    content.append(grid.render())
    content.append(self.__('When you done with this, click on Next'))

    this.dialog.setBody(content)
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

  loopInstances () {
    let self = this
    this.step = 4
    let bridges = this.application.getBridges().filter(bridge => bridge.roomId !== 0)
    if (this.wizzardStepBridgeNum >= bridges.length) {
      this.finishStep(5)
    }
    var content
    let bridge = bridges[this.wizzardStepBridgeNum]
    if (bridge) {
      let roomId = bridge.roomId
      // show all devices in this room
      let room = this.roomDeviceList.filter(room => room.id === roomId)[0] || undefined
      if (room) {
        this.wizzardSettings = {
          method: 'createapplicanceswizzard',
          instanceId: bridge.id,
          channels: []
        }
        // build a channel List
        let channelzToAdd = []
        room.devices.map(device => {
          device.channels.map(channel => {
            let name = self.buildSuggestedName(device, channel)
            channelzToAdd.push({deviceName: device.name, channel: channel, transfer: false, name: name})
          })
        })
        this.wizzardSettings.channels = channelzToAdd
        content = $('<div>').append(self.__('Room %s', room.name))
        content.append('<br />')
        content.append(self.__('Please mark all channels from this room, you want to use in HomeKit.'))

        let grid = new DatabaseGrid('devroom', channelzToAdd, {rowStyle: 'margin-bottom:5px'})
        grid.maxRecords = 15
        grid.setTitleLabels([this.__('Add'), this.__('Device'), this.__('Channel/Type'), this.__('HomeKit name')])
        grid.setColumns([
          {sz: {sm: 6, md: 1, lg: 1, xl: 1}},
          {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
          {sz: {sm: 6, md: 3, lg: 3, xl: 3}},
          {sz: {sm: 6, md: 4, lg: 4, xl: 4}}
        ])
        grid.setRenderer((row, chObj) => {
          // create a subGrid
          let checkBox = new CheckBox('create_' + chObj.channel.id, true, (e, input) => {
            chObj.transfer = input.checked
            self.wizzardSettings.channels = channelzToAdd
          })
          checkBox.setValue(chObj.transfer)

          let inputName = new Input('applicance_' + chObj.channel.id, chObj.name, (e, input) => {
            chObj.name = input.value
            // if the user edits the name he wants to add this .. i think
            chObj.transfer = true
            checkBox.setValue(true)
          })

          return ([checkBox.render(), chObj.deviceName, chObj.channel.name + '<br />' + chObj.channel.type, inputName.render()])
        })

        content.append(grid.render())
      } else {
        content = $('<div>').append('wizzard error, roomt not found')
      }
      content.append(self.__('You may add other channels later via this WebUI'))

      this.dialog.setBody(content)
    }
  }

  showFinalPage () {
    this.step = 4
    let content = $('<div>').append(this.__('OK, you are done. You should now be able to control the selected devices via HomeKit.'))
    content.append('<br /><br />')
    content.append(this.__('Some devices have additional settings or alternative services. Settings can be made here.'))
    content.append(this.__('You can add programs and variables to homekit via the WebUI.'))
    content.append('<br /><br />')
    content.append(this.__('Have fun ! :o)'))
    content.append('<br />')
    this.dialog.setBody(content)
  }

  async finishStep (step) {
    let self = this
    switch (step) {
      case 0:
        this.createPage1()
        break
      case 1:
        self.activitySpinner.setActive(true)
        await this.application.makeApiRequest({method: 'createinstancewizzard', playload: JSON.stringify(this.instancesToCreate)})
        setTimeout(async () => {
          await this.application.refreshBridges()
          self.activitySpinner.setActive(false)
          this.step = 2
          this.createPage2()
        }, 4000)
        break
      case 2:
        this.createPage2()
        break
      case 3:
        this.wizzardStepBridgeNum = 0
        await this.application.refreshBridges()
        this.loopInstances()
        break

      case 4:
        // filter all channels with transfer = true
        this.activitySpinner.setActive(true)
        var chList = this.wizzardSettings.channels
        chList = chList.filter(cObj => cObj.transfer === true)
        // remove device stuff
        let payload = []
        chList.map(chObj => {
          chObj.channel.name = chObj.name // copy the users name
          payload.push(chObj.channel)
        })
        this.wizzardSettings.channels = undefined // remove this
        this.wizzardSettings.payload = JSON.stringify(payload)
        await this.application.makeApiRequest(this.wizzardSettings)
        this.wizzardStepBridgeNum = this.wizzardStepBridgeNum + 1
        this.activitySpinner.setActive(false)
        this.loopInstances()
        break

      case 5:
        // show final page
        this.finishButton.setActive(true)
        this.nextButton.setActive(false)
        this.showFinalPage()
        break
    }
  }

  run (roomDeviceList, step) {
    this.roomDeviceList = roomDeviceList
    this.finishStep(step)
    super.run()
  }
}
