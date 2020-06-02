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

    this.scheduleMode = false
    this.tempOfs = -1.5
    this.tempLo = 17
    this.tempHi = 21

    // check if we have programmable data in this._persistentValues
    if (!this.loadSchedules()) {
      this.log.debug('[HTPCA] no persistent data or invalid data found loading defaults')
      this.program1 = DEFAULT_PROG
      this.program2 = DEFAULT_PROG
      this.program3 = DEFAULT_PROG
      this.program4 = DEFAULT_PROG
      this.program5 = DEFAULT_PROG
      this.program6 = DEFAULT_PROG
      this.program7 = DEFAULT_PROG
      this.programFree = DEFAULT_PROG
    }

    this.log.debug('[HTPCA] createing eve thermo stuff')
    const EveHomeKitThermoTypes = require(path.join(__dirname, 'EveThermo.js'))

    let eveThermoProg = new EveHomeKitThermoTypes({homebridge: this.gatoHomeBridge})
    // add Programming Stuff

    this.service.addOptionalCharacteristic(eveThermoProg.Characteristic.ProgramData)
    this.service.addOptionalCharacteristic(eveThermoProg.Characteristic.ProgramCommand)
    this.service.addOptionalCharacteristic(eveThermoProg.Characteristic.FirmwareInfo)

    let sPD = this.service.getCharacteristic(eveThermoProg.Characteristic.ProgramData)
    console.log(sPD)
    sPD.on('get', this.cbGetProgramData.bind(this))

    this.service.getCharacteristic(eveThermoProg.Characteristic.ProgramCommand)
      .on('set', this.cbSetProgramCommand.bind(this))

    this.service.getCharacteristic(eveThermoProg.Characteristic.FirmwareInfo)
      .updateValue(Buffer.from('2ce30400', 'hex').toString('base64')) // build 1251 (0x04e3)
  }

  // callback function that is bound to GET ProgramData
  cbGetProgramData (callback) {
    this.log.debug('GET ProgramData:')
    let buf = Buffer.alloc(128)
    let ofs = 0

    // Temp Offset
    buf.writeUInt8(0x12, ofs)
    let tempOfs = Math.round(this.tempOfs * 10)
    buf.writeInt8(tempOfs, ofs + 1)
    ofs += 2

    // Enabled
    buf.writeUInt8(0x13, ofs)
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

    this.log.debug('[HTPCA]  - Data stream: %s (%d Byte)', hexVal, buf.length)
    callback(null, buf.toString('base64'))
  }

  // callback function that is bound to SET ProgramCommand
  cbSetProgramCommand (val, callback) {
    this.log.debug('[HTPCA] SET ProgramCommand:')
    let buf = Buffer.from(val, 'base64')
    let length = buf.length
    let ofs = 0

    // flag variables for later commands
    let setTemp = null
    let setEnableSchedule = null
    let setVacationMode = null

    let hexVal = buf.toString('hex')
    this.log.debug('[HTPCA]  - Data stream: %s', hexVal)

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
          this.log.debug('[HTPCA]  - Remove')
          break
        }
        case 0x11: { // Valve Protection
          // do nothing
          this.log.debug('[HTPCA]  - valve protection')
          break
        }
        case 0x12: { // Temp Offset
          this.tempOfs = buf.readInt8(ofs) / 10
          ofs += 1
          this.log.debug('[HTPCA]  - Temp Ofs: %f', this.tempOfs)
          break
        }
        case 0x13: { // Enable
          setEnableSchedule = buf.readUInt8(ofs) !== 0
          ofs += 1
          this.log.debug('[HTPCA]  - Enable schedule: %s', setEnableSchedule)
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
          this.log.debug('[HTPCA]  - Temp now: %s, Temp low: %s, Temp high: %s', tempNow, tempLo, tempHi)
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
          this.log.debug('[HTPCA]  - Date and Time: %s', dateTime)
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
          this.log.debug('[HTPCA] - Program MO: %s', this.programToDisplayString(this.program1))
          this.log.debug('[HTPCA] - Program TU: %s', this.programToDisplayString(this.program2))
          this.log.debug('[HTPCA] - Program WE: %s', this.programToDisplayString(this.program3))
          this.log.debug('[HTPCA] - Program TH: %s', this.programToDisplayString(this.program4))
          this.log.debug('[HTPCA] - Program FR: %s', this.programToDisplayString(this.program5))
          this.log.debug('[HTPCA] - Program SA: %s', this.programToDisplayString(this.program6))
          this.log.debug('[HTPCA] - Program SU: %s', this.programToDisplayString(this.program7))
          break
        }
        case 0x1a: { // Program (free day)
          this.programFree = this.parseProgram(buf.slice(ofs, ofs + 8))
          ofs += 8
          this.log.debug('[HTPCA] - Program Free: %s', this.programToDisplayString(this.programFree))
          break
        }
        case 0x19: { // Vacation Mode
          setVacationMode = buf.readUInt8(ofs) !== 0
          let temp = buf.readUInt8(ofs + 1)
          this.vacationTemp = (temp === 0xFF) ? null : (temp * 0.5)
          ofs += 2
          temp = this.vacationTemp ? (this.vacationTemp.toString() + '°C') : 'OFF'
          this.log.debug('[HTPCA] - vacation mode: %s (%s)', setVacationMode, temp)
          break
        }
        case 0xf2: { // ???
          let val = buf.readUInt16LE(ofs)
          ofs += 2
          this.log.debug('[HTPCA] - F2: %d', val)
          break
        }
        case 0xf6: { // ???
          this.log.debug('[HTPCA] - F6')
          break
        }
        case 0x7f: { // ???
          this.log.debug('[HTPCA] - 7F')
          break
        }
        case 0xff: { // ???
          let val = buf.readUInt8(ofs)
          ofs += 1
          this.log.debug('[HTPCA] - FF: %d', val)
          break
        }
        default: {
          this.log.debug('[HTPCA] - Unknown OpCode %s', opcode.toString(16))
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
    this.log.debug('[HTPCA] getCurrentThermostate Programms')
    let deviceMasterData = await this._ccu.sendInterfaceCommand(this._interf, 'getParamset', [this._serial, 'MASTER'])
    //
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
