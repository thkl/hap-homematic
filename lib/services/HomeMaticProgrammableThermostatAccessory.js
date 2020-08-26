/*
 * File: HomeMaticProgrammableThermostatAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 23rd May 2020 10:17:26 pm
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
const HomeMaticThermostatAccessory = require(path.join(__dirname, 'HomeMaticThermostatAccessory.js'))
const Format = require('util').format
const crypto = require('crypto')

const DEFAULT_PROG = {
  periods: [
    {
      strHour: 6,
      strMinute: 0,
      endHour: 9,
      endMinute: 0
    },
    {
      strHour: 17,
      strMinute: 0,
      endHour: 22,
      endMinute: 0
    }
  ],
  hex: '24366684fffffffff' // This string must match to the period entries above!
}

class HomeMaticProgrammableThermostatAccessory extends HomeMaticThermostatAccessory {
  publishServices (Service, Characteristic) {
    super.publishServices(Service, Characteristic)
    let self = this
    let settings = this.getDeviceSettings()
    this.eveprog = settings.eveprog || '1'
    this.scheduleMode = false
    this.schedulerWasSet = false
    this.tempLo = 17
    this.tempHi = 21
    this.controlModes = {
      AUTO: parseInt(this.deviceServiceSettings('ControlModeAuto')),
      MANU: parseInt(this.deviceServiceSettings('ControlModeManu'))
    }

    // check if we have programmable data in this._persistentValues
    if (!this.loadSchedules()) {
      this.debugLog('no persistent data or invalid data found loading defaults')
      this.program1 = DEFAULT_PROG
      this.program2 = DEFAULT_PROG
      this.program3 = DEFAULT_PROG
      this.program4 = DEFAULT_PROG
      this.program5 = DEFAULT_PROG
      this.program6 = DEFAULT_PROG
      this.program7 = DEFAULT_PROG
      this.programFree = DEFAULT_PROG
    }

    this.debugLog('createing eve thermo stuff')
    const EveHomeKitThermoTypes = require(path.join(__dirname, 'EveThermo.js'))

    let eveThermoProg = new EveHomeKitThermoTypes(this.gatoHomeBridge.hap)
    // add Programming Stuff

    this.service.addOptionalCharacteristic(eveThermoProg.Characteristic.ProgramData)
    this.service.addOptionalCharacteristic(eveThermoProg.Characteristic.ProgramCommand)
    this.service.addOptionalCharacteristic(eveThermoProg.Characteristic.FirmwareInfo)

    let sPD = this.service.getCharacteristic(eveThermoProg.Characteristic.ProgramData)
    sPD.on('get', this.cbGetProgramData.bind(this))

    this.service.getCharacteristic(eveThermoProg.Characteristic.ProgramCommand)
      .on('set', this.cbSetProgramCommand.bind(this))

    this.service.getCharacteristic(eveThermoProg.Characteristic.FirmwareInfo)
      .updateValue(Buffer.from('2ce30400', 'hex').toString('base64')) // build 1251 (0x04e3)

    // we have to override this.tarHeatingState set because eve will call mode heat on enabling scheduler
    this.tarHeatingState.removeAllListeners('set') // remove the listener set by the superclass
    this.tarHeatingState.on('set', async (newValue, callback) => {
      self.debugLog('setTargetHeatingCoolingState %s (scheduler was set is %s)', newValue, self.schedulerWasSet)
      if (self.schedulerWasSet === true) {
        // update the Mode to Auto back
        setTimeout(() => {
          self.debugLog('resetting Mode to Auto (Scheduler Event)')
          self.tarHeatingState.updateValue(3)
        }, 1000)
      } else {
        if (self.targetTemperature === self.offTemp) {
          self.targetTemperature = 20 // set a temp other than off temp
        }
        self.setControlMode(newValue)
      }
      self.schedulerWasSet = false
      callback()
    })
  }

  // callback function that is bound to GET ProgramData
  async cbGetProgramData (callback) {
    this.debugLog('GET ProgramData:')
    let buf = Buffer.alloc(128)
    let ofs = 0

    // Temp Offset
    buf.writeUInt8(0x12, ofs)
    let tempOfs = await this.getTempOffset()
    tempOfs = Math.round(tempOfs * 10)
    buf.writeInt8(tempOfs, ofs + 1)
    ofs += 2

    // Enabled
    buf.writeUInt8(0x13, ofs)
    await this.getControlMode()
    this.scheduleMode = (this.controlMode === this.controlModes.AUTO)
    this.debugLog('GET ProgramData: getControlMode %s %s scheduleMode %s', this.controlMode, typeof this.controlMode, this.scheduleMode)
    buf.writeUInt8(this.scheduleMode, ofs + 1)
    ofs += 2

    // Installation (details unclear)
    buf.writeUInt8(0x14, ofs)
    buf.writeUInt8(0xc0, ofs + 1) // c0-c7
    ofs += 2

    // Vacation Mode
    buf.writeUInt8(0x19, ofs)
    let tempVacation = this.vacationTemp ? (this.vacationTemp * 2) : 0xFF
    buf.writeUInt8(this.vacationMode, ofs + 1)
    buf.writeUInt8(tempVacation, ofs + 2)
    ofs += 3

    // Time and Date
    buf.writeUInt8(0xfc, ofs)
    let now = new Date()
    buf.writeUInt8(now.getMinutes(), ofs + 1)
    buf.writeUInt8(now.getHours(), ofs + 2)
    buf.writeUInt8(now.getDate(), ofs + 3)
    buf.writeUInt8(now.getMonth() + 1, ofs + 4)
    buf.writeUInt8(now.getFullYear() % 100, ofs + 5)
    ofs += 6

    // Temperature Levels
    buf.writeUInt8(0xf4, ofs)
    let tempLo = this.tempLo ? (this.tempLo * 2) : 0x80
    let tempHi = this.tempHi ? (this.tempHi * 2) : 0x80
    buf.writeUInt8(0x10, ofs + 1) // unclear what this temperature indicates
    buf.writeUInt8(0x10, ofs + 2) // unclear what this temperature indicates
    buf.writeUInt8(tempLo, ofs + 3)
    buf.writeUInt8(tempHi, ofs + 4)
    ofs += 5

    // Open window
    buf.writeUInt8(0xf6, ofs)
    if (this.openWindow) {
      buf.writeUInt8(0x10, ofs + 1) // this one bit is necessary
    } else {
      buf.writeUInt8(0x00, ofs + 1)
    }
    buf.writeUInt8(0x00, ofs + 2) // ?
    buf.writeUInt8(0x00, ofs + 3) // ?
    ofs += 4

    // Program (free day)
    buf.writeUInt8(0x1a, ofs)
    ofs += 1
    buf.write(this.programFree.hex, ofs, 'hex')
    ofs += 8

    // Program (week)
    buf.writeUInt8(0xfa, ofs)
    ofs += 1
    buf.write(this.program1.hex, ofs, 'hex')
    ofs += 8
    buf.write(this.program2.hex, ofs, 'hex')
    ofs += 8
    buf.write(this.program3.hex, ofs, 'hex')
    ofs += 8
    buf.write(this.program4.hex, ofs, 'hex')
    ofs += 8
    buf.write(this.program5.hex, ofs, 'hex')
    ofs += 8
    buf.write(this.program6.hex, ofs, 'hex')
    ofs += 8
    buf.write(this.program7.hex, ofs, 'hex')
    ofs += 8

    // 17 04 0a ????

    // f3 38 19 00 00 ????

    // trim buffer
    let hexVal = buf.slice(0, ofs).toString('hex')
    buf = Buffer.from(hexVal, 'hex')

    this.debugLog(' - Data stream: %s (%d Byte)', hexVal, buf.length)
    callback(null, buf.toString('base64'))
  }

  // callback function that is bound to SET ProgramCommand
  cbSetProgramCommand (val, callback) {
    this.debugLog('SET ProgramCommand:')
    let buf = Buffer.from(val, 'base64')
    let length = buf.length
    let ofs = 0

    // flag variables for later commands
    let setTemp = null
    let setEnableSchedule = null
    let setVacationMode = null

    let hexVal = buf.toString('hex')
    this.debugLog(' - Data stream: %s', hexVal)

    // parsing data stream
    let opcode = 0
    while (ofs < length) {
      opcode = buf.readUInt8(ofs)
      ofs += 1
      switch (opcode) {
        case 0x00: { // Start of Command
          break
        }
        case 0x06: { // End of Command
          break
        }
        case 0x10: { // Remove?
          // do nothing
          this.debugLog(' - Remove')
          break
        }
        case 0x11: { // Valve Protection
          // do nothing
          this.debugLog(' - valve protection')
          break
        }
        case 0x12: { // Temp Offset
          this.tempOfs = buf.readInt8(ofs) / 10
          ofs += 1
          this.debugLog(' - Temp Ofs: %f', this.tempOfs)
          this.saveOffset(this.tempOfs)
          break
        }
        case 0x13: { // Enable
          setEnableSchedule = buf.readUInt8(ofs) !== 0
          ofs += 1
          this.debugLog(' - Enable schedule: %s', setEnableSchedule)
          this.schedulerWasSet = true
          this.setControlMode(setEnableSchedule ? 3 : 1)
          break
        }
        case 0xf4: { // Temperature Levels
          let tempNow = buf.readUInt8(ofs)
          let tempLo = buf.readUInt8(ofs + 1)
          let tempHi = buf.readUInt8(ofs + 2)
          setTemp = (tempNow === 0x80) ? null : (tempNow * 0.5)
          this.tempLo = (tempLo === 0x80) ? null : (tempLo * 0.5)
          this.tempHi = (tempHi === 0x80) ? null : (tempHi * 0.5)
          ofs += 3
          tempNow = setTemp ? (setTemp.toString() + '°C') : 'NO'
          tempLo = this.tempLo ? (this.tempLo.toString() + '°C') : 'NO'
          tempHi = this.tempHi ? (this.tempHi.toString() + '°C') : 'NO'
          this.debugLog(' - Temp now: %s, Temp low: %s, Temp high: %s', tempNow, tempLo, tempHi)
          break
        }
        case 0xfc: { // Date and Time
          let mm = this.leadingZeroString(buf.readUInt8(ofs))
          ofs += 1
          let hh = this.leadingZeroString(buf.readUInt8(ofs))
          ofs += 1
          let DD = this.leadingZeroString(buf.readUInt8(ofs))
          ofs += 1
          let MM = this.leadingZeroString(buf.readUInt8(ofs))
          ofs += 1
          let YY = this.leadingZeroString(buf.readUInt8(ofs))
          ofs += 1
          // do nothing (server time should be correct)
          let dateTime = Format('%d.%d.%d %d:%d', DD, MM, YY, hh, mm)
          this.debugLog(' - Date and Time: %s', dateTime)
          break
        }
        case 0xfa: { // Program (week)
          this.program1 = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.program2 = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.program3 = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.program4 = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.program5 = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.program6 = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.program7 = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.debugLog('- Program MO: %s', this.programToDisplayString(this.program1))
          this.debugLog('- Program TU: %s', this.programToDisplayString(this.program2))
          this.debugLog('- Program WE: %s', this.programToDisplayString(this.program3))
          this.debugLog('- Program TH: %s', this.programToDisplayString(this.program4))
          this.debugLog('- Program FR: %s', this.programToDisplayString(this.program5))
          this.debugLog('- Program SA: %s', this.programToDisplayString(this.program6))
          this.debugLog('- Program SU: %s', this.programToDisplayString(this.program7))
          break
        }
        case 0x1a: { // Program (free day)
          this.programFree = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.debugLog('- Program Free: %s', this.programToDisplayString(this.programFree))
          break
        }
        case 0x19: { // Vacation Mode
          setVacationMode = buf.readUInt8(ofs) !== 0
          let temp = buf.readUInt8(ofs + 1)
          this.vacationTemp = (temp === 0xFF) ? null : (temp * 0.5)
          ofs += 2
          temp = this.vacationTemp ? (this.vacationTemp.toString() + '°C') : 'OFF'
          this.debugLog('- vacation mode: %s (%s)', setVacationMode, temp)
          break
        }
        case 0xf2: { // ???
          let val = buf.readUInt16LE(ofs)
          ofs += 2
          this.debugLog('- F2: %d', val)
          break
        }
        case 0xf6: { // ???
          this.debugLog('- F6')
          break
        }
        case 0x7f: { // ???
          this.debugLog('- 7F')
          break
        }
        case 0xff: { // ???
          let val = buf.readUInt8(ofs)
          ofs += 1
          this.debugLog('- FF: %d', val)
          break
        }
        default: {
          this.debugLog('- Unknown OpCode %s', opcode.toString(16))
          break
        }
      }
    }

    if (setVacationMode !== null) {

    } else if (setEnableSchedule === true) {
      this.saveAndEnableSchedules(setTemp)
    } else if (setEnableSchedule === false) {

    }

    callback()
  }

  async saveOffset (newtempOfs) {
    let ofData = this.deviceServiceSettings('OffsetData')
    let ofDKey = this.deviceServiceSettings('OffsetDeviceKey')
    if (ofData) {
      let ofKey = ofData.indexOf(newtempOfs)
      this.debugLog('saveOffset %s HM is %s', newtempOfs, ofKey)
      let deviceMasterData = await this._ccu.sendInterfaceCommand(this._interf, 'getParamset', [this._serial, 'MASTER'])
      deviceMasterData[ofDKey] = ofKey
      await this._ccu.sendInterfaceCommand(this._interf, 'putParamset', [this._serial, 'MASTER', deviceMasterData])
    }
  }

  async getTempOffset () {
    if (this.tempOfs) {
      return this.tempOfs
    }
    let deviceMasterData = await this._ccu.sendInterfaceCommand(this._interf, 'getParamset', [this._serial, 'MASTER'])
    let ofData = this.deviceServiceSettings('OffsetData')
    let ofDKey = this.deviceServiceSettings('OffsetDeviceKey')
    if ((deviceMasterData) && (ofData) && (ofData.length >= deviceMasterData[ofDKey])) {
      this.tempOfs = parseFloat(ofData[deviceMasterData[ofDKey]])
      this.debugLog('getOffset is %s', this.tempOfs)
    } else {
      this.debugLog('getOffset unable to get value from device')
      this.tempOfs = 0
    }
    return this.tempOfs
  }

  saveAndEnableSchedules (setTemp) {
    let schedules = {}
    schedules.programms = {}
    schedules.programms[1] = this.program1
    schedules.programms[2] = this.program2
    schedules.programms[3] = this.program3
    schedules.programms[4] = this.program4
    schedules.programms[5] = this.program5
    schedules.programms[6] = this.program6
    schedules.programms[7] = this.program7
    schedules.programms['f'] = this.programFree
    schedules.tempHi = this.tempHi
    schedules.tempLow = this.tempLo

    // load persistent values and check if they changed
    this.debugLog('Checking schedules')
    let savedSchedules = this.getPersistentValue('prgtemp', undefined)
    if ((schedules !== undefined) && (savedSchedules !== undefined)) {
      let sHash = crypto.createHash('md5').update(JSON.stringify(savedSchedules)).digest('hex')
      let nHash = crypto.createHash('md5').update(JSON.stringify(schedules)).digest('hex')
      if (sHash === nHash) {
        this.debugLog('Schedules did not change returning')
        return
      }
    }
    this.debugLog('Saving schedules')
    // Save this to the file
    this.savePersistentValue('prgtemp', schedules)

    // save to the device
    this.sendProgramToDevice(schedules)
  }

  // load the schedules from persistent data
  loadSchedules () {
    let schedules = this.getPersistentValue('prgtemp', undefined)
    if (!schedules) {
      return false
    }
    if ((schedules) && (schedules.programms)) {
      if (schedules.programms[1]) {
        this.program1 = schedules.programms[1]
      } else {
        return false
      }
      if (schedules.programms[2]) {
        this.program2 = schedules.programms[2]
      } else {
        return false
      }
      if (schedules.programms[3]) {
        this.program3 = schedules.programms[3]
      } else {
        return false
      }
      if (schedules.programms[4]) {
        this.program4 = schedules.programms[4]
      } else {
        return false
      }
      if (schedules.programms[5]) {
        this.program5 = schedules.programms[5]
      } else {
        return false
      }
      if (schedules.programms[6]) {
        this.program6 = schedules.programms[6]
      } else {
        return false
      }
      if (schedules.programms[7]) {
        this.program7 = schedules.programms[7]
      } else {
        return false
      }
      if (schedules.programms.f) {
        this.programFree = schedules.programms.f
      } else {
        return false
      }
      this.tempHi = schedules.tempHi || 21
      this.tempLo = schedules.tempLo || 17
    }
    return true
  }

  async sendProgramToDevice (schedules) {
    // first load the schedules from device
    this.debugLog('getCurrentThermostate Programms')
    let deviceMasterData = await this._ccu.sendInterfaceCommand(this._interf, 'getParamset', [this._serial, 'MASTER'])
    // check number of profiles
    var allfound = false
    var maxSteps = 1
    while (!allfound) {
      let tempKey = this.deviceServiceSettingsFromTemplate('ProgramTemplate', null, {prgNum: 1, key: 'ENDTIME', 'day': 'MONDAY', prgStep: maxSteps})
      if (deviceMasterData[tempKey] === undefined) {
        allfound = true
        maxSteps = maxSteps - 1
      } else {
        maxSteps = maxSteps + 1
      }
    }
    this.debugLog('device knows %s program steps', maxSteps)
    // generate Thermo Data
    let p1 = this.buildHomeMaticThermoProfile(this.eveprog, 'MONDAY', this.program1, this.tempLo, this.tempHi, maxSteps)
    let p2 = this.buildHomeMaticThermoProfile(this.eveprog, 'TUESDAY', this.program2, this.tempLo, this.tempHi, maxSteps)
    let p3 = this.buildHomeMaticThermoProfile(this.eveprog, 'WEDNESDAY', this.program3, this.tempLo, this.tempHi, maxSteps)
    let p4 = this.buildHomeMaticThermoProfile(this.eveprog, 'THURSDAY', this.program4, this.tempLo, this.tempHi, maxSteps)
    let p5 = this.buildHomeMaticThermoProfile(this.eveprog, 'FRIDAY', this.program5, this.tempLo, this.tempHi, maxSteps)
    let p6 = this.buildHomeMaticThermoProfile(this.eveprog, 'SATURDAY', this.program6, this.tempLo, this.tempHi, maxSteps)
    let p7 = this.buildHomeMaticThermoProfile(this.eveprog, 'SUNDAY', this.program7, this.tempLo, this.tempHi, maxSteps)
    // generate new Master Data
    const newDeviceMasterData = { ...deviceMasterData,
      ...p1,
      ...p2,
      ...p3,
      ...p4,
      ...p5,
      ...p6,
      ...p7 }
    // activate the new program
    newDeviceMasterData.WEEK_PROGRAM_POINTER = (parseInt(this.eveprog) - 1) // P1 is 0 P2 is 1 ...
    // save program into thermostat
    await this._ccu.sendInterfaceCommand(this._interf, 'putParamset', [this._serial, 'MASTER', newDeviceMasterData])
  }

  buildHomeMaticThermoProfile (profileID, day, program, tempLow, tempHi, numProfileEntries) {
    // ccu thermo programms work like this :
    // it starts with 000 seconds on 0:00
    // P1_ENDTIME_MONDAY_1 = 300 and P1_TEMPERATURE_MONDAY_1 = 20 means 0:00 - 5:00 = 20 degree
    // P1_ENDTIME_MONDAY_2 = 360 and P1_TEMPERATURE_MONDAY_2 = 21 means 0:50 - 6:00 = 21 degree and so on
    this.debugLog('buildHomeMaticThermoProfile ID %s Day %s', profileID, day)
    let self = this
    let result = {}
    var eTKey
    var tempKey
    let index = 1
    if (program.periods) {
      program.periods.map((periode) => {
        // build the previous low temp section
        eTKey = self.deviceServiceSettingsFromTemplate('ProgramTemplate', null, {prgNum: profileID, key: 'ENDTIME', 'day': day, prgStep: index})
        tempKey = self.deviceServiceSettingsFromTemplate('ProgramTemplate', null, {prgNum: profileID, key: 'TEMPERATURE', 'day': day, prgStep: index})
        var mins = (periode.strHour * 60) + periode.strMinute
        result[eTKey] = mins
        result[tempKey] = {explicitDouble: tempLow}
        index = index + 1
        // build the current high temp section
        mins = (periode.endHour * 60) + periode.endMinute
        eTKey = self.deviceServiceSettingsFromTemplate('ProgramTemplate', null, {prgNum: profileID, key: 'ENDTIME', 'day': day, prgStep: index})
        tempKey = self.deviceServiceSettingsFromTemplate('ProgramTemplate', null, {prgNum: profileID, key: 'TEMPERATURE', 'day': day, prgStep: index})
        result[eTKey] = mins
        result[tempKey] = {explicitDouble: tempHi}
        index = index + 1
      })
      while (index <= numProfileEntries) {
      // and we have to add a lowTemp Periode till the end of the day which is 1440
        eTKey = self.deviceServiceSettingsFromTemplate('ProgramTemplate', null, {prgNum: profileID, key: 'ENDTIME', 'day': day, prgStep: index})
        tempKey = self.deviceServiceSettingsFromTemplate('ProgramTemplate', null, {prgNum: profileID, key: 'TEMPERATURE', 'day': day, prgStep: index})
        result[eTKey] = 1440
        result[tempKey] = {explicitDouble: tempLow}
        index = index + 1
      }
    }
    return result
  }

  static channelTypes () {
    return ['HM-TC-IT-WM-W-EU:THERMALCONTROL_TRANSMIT']
  }

  initServiceSettings () {
    return {
      'HM-TC-IT-WM-W-EU:THERMALCONTROL_TRANSMIT': {
        Temperature: {name: 'ACTUAL_TEMPERATURE'},
        Humidity: {name: 'ACTUAL_HUMIDITY'},
        ControlMode: {name: 'CONTROL_MODE'},
        SetTemperature: {name: 'SET_TEMPERATURE'},
        SetManuMode: {name: 'MANU_MODE', value: 1},
        SetAutoMode: {name: 'AUTO_MODE', value: 1},
        ControlModeAuto: 0,
        ControlModeManu: 1,
        ProgramTemplate: 'P%prgNum%_%key%_%day%_%prgStep%',
        OffsetData: [-3.5, -3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
        OffsetDeviceKey: 'TEMPERATURE_OFFSET',
        minTemp: {name: 'TEMPERATURE_MINIMUM'},
        maxTemp: {name: 'TEMPERATURE_MAXIMUM'}
      }
    }
  }

  static configurationItems () {
    return {
      'addBootMode': {
        type: 'checkbox',
        default: false,
        label: 'Add a boost mode switch',
        hint: 'adds a switch to turn the boost mode on'
      },
      'eveprog': {
        type: 'option',
        array: ['1', '2', '3'],
        default: '1',
        label: 'use thermostat program no.',
        hint: 'Settings from eve will stored as program at the thermostat'
      }
    }
  }

  /*
   *  utility functions
   */

  parseProgram (buf) {
    let program = {}
    program.periods = []
    program.hex = buf.toString('hex')

    let ofs = 0
    // loop through max. 3 heating periods
    for (let i = 0; i < 3; i++) {
      let str = buf.readUInt8(ofs)
      let end = buf.readUInt8(ofs + 1)
      if (str !== 0xFF) {
        str = str * 10
        end = end * 10
        let strMinute = str % 60
        let strHour = (str - strMinute) / 60
        let endMinute = end % 60
        let endHour = (end - endMinute) / 60
        program.periods.push({
          strHour: strHour,
          strMinute: strMinute,
          endHour: endHour,
          endMinute: endMinute
        })
      }
      ofs += 2
    }

    return program
  }

  leadingZeroString (val) {
    return (val < 10) ? Format('0%d', val) : val.toString()
  }

  programToDisplayString (program) {
    let progStr = ''

    if (!Array.isArray(program.periods)) {
      return null
    }

    program.periods.forEach((elem, idx) => {
      if (idx > 0) {
        progStr += ' / '
      }
      progStr += Format('%s:%s - %s:%s',
        this.leadingZeroString(elem.strHour),
        this.leadingZeroString(elem.strMinute),
        this.leadingZeroString(elem.endHour),
        this.leadingZeroString(elem.endMinute)
      )
    })

    return progStr
  }
}

module.exports = HomeMaticProgrammableThermostatAccessory
