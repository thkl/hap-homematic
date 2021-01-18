/*
 * File: HomeMaticProgrammableSwitchAccessory.js
 * Project: hap-homematic
 * File Created: Saturday, 4th July 2020 7:45:44 pm
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
const Format = require('util').format
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticProgrammableSwitchAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var service
    this.isSchedulerOn = true
    this.pgrBuff = undefined
    this.dayData = 0

    const EveHomeKitEnergyTypes = require(path.join(__dirname, 'EveEnergy.js'))

    let eveEnergyProg = new EveHomeKitEnergyTypes(this.gatoHomeBridge.hap)
    let readOnly = this.isReadOnly()
    service = this.getService(Service.Switch)
    this.isOnCharacteristic = service.getCharacteristic(Characteristic.On)

    this.isOnCharacteristic.on('get', (callback) => {
      self.getValue('STATE', true).then(value => {
        callback(null, self.isTrue(value))
      })
    })

    this.isOnCharacteristic.on('set', (value, callback) => {
      if (!readOnly) {
        self.log.debug('[Switch] set switch %s', value)

        if (value === false) {
          self.setValue('STATE', 0)
        } else {
          self.setValue('STATE', 1)
        }
      } else {
        // check the state to reset the HomeKit State
        self.log.debug('[Switch] is readOnly .. skipping')
        setTimeout(() => {
          self.getValue('STATE', true)
        }, 1000)
      }
      callback()
    })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), (newValue) => {
      self.log.debug('[SWITCH] event state %s', newValue)
      // Add a Log Entry for Eve
      self.addLogEntry({status: self.isTrue(newValue) ? 1 : 0})
      // Set Last Activation if the switch is on
      if (self.isTrue(newValue)) {
        self.updateLastActivation()
      }
      self.isOnCharacteristic.updateValue(self.isTrue(newValue), null)
    })
    // Loggin only works on Switches
    this.enableLoggingService('switch')
    this.addLastActivationService(this.loggingService)

    if (this._deviceType === 'HM-Dis-TD-T') {
      this.addLowBatCharacteristic()
    }
/*
    if (this.loggingService) {
      this.log.debug('[SWITCH] adding Eve FirmwarInfo')
      service.addOptionalCharacteristic(eveEnergyProg.Characteristic.FirmwareInfo)
      service.getCharacteristic(eveEnergyProg.Characteristic.FirmwareInfo)
        .updateValue(Buffer.from('1F00010E2400B8040A00F473069A430F8ADD', 'hex').toString('base64'))

      service.addOptionalCharacteristic(eveEnergyProg.Characteristic.ProgramInfo)
      service.getCharacteristic(eveEnergyProg.Characteristic.ProgramInfo)
        .on('get', this.cbGetProgramData.bind(this))

        /* (callback) => {
          self.log.debug('[SWITCH] get ProgramInfo')
          callback(null, Buffer.from('450B05020000000000810001A5465405D31B2C1F00', 'hex').toString('base64'))
        })
        */
/*
      service.addOptionalCharacteristic(eveEnergyProg.Characteristic.ProgramData)
      service.getCharacteristic(eveEnergyProg.Characteristic.ProgramData)
        .on('set', (value, callback) => {
          self.cbSetProgramCommand(value)
          callback()
        })
    }

    */
  }
/*
  cbGetProgramData (callback) {
    if (!this.pgrBuff) {
      let buf = Buffer.from('000224000302B804040C425630334A314130393931380602A20807043E1000000B0200000501000204483200005F0400000000190296001401030F0400000000450B05020000000000810005A5465405D31B2C1F000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004411050D0005033C000000F3215242A5535341471105731B451CDF1CB81DB40000003C00000048060500000000004A060500000000001A04000000006001A1D0046BAF01009B0491F71300D200', 'hex')
      this.debugLog('GET ProgramData Sent Dummy: %s', buf.toString('hex'))
      callback(null, buf.toString('base64'))
    } else {
      let fmt = '000224000302B804040C425630334A314130393931380602080807043E1000000B0200000501000204483200005F0400000000190296001401030F0400000000%s000000%s00000000000000%s00005033C000000F3215242A5535341471105731B451CDF1CB81DB40000003C00000048060500000000004A060500000000001A04000000006001A1D0046BAF01009B04968F1200D200'
      let buf = Buffer.from(Format(fmt, this.pgrBuff, this.getDayControlData(), this.schedulerOnOff()), 'hex')
      this.debugLog('GET ProgramData: %s', buf.toString('hex'))
      callback(null, buf.toString('base64'))
    }
  }

  bitTest (num, bit) {
    return ((num >> bit) % 2 !== 0)
  }

  bitSet (num, bit) {
    return num | 1 << bit
  }

  bitClear (num, bit) {
    return num & ~(1 << bit)
  }

  parseProgramEvent (data) {
    let result = {}
    console.log('Data Value : %s', data)
    result.astro = this.bitTest(data, 1) // Astro is Bit 0
    result.isON = this.bitTest(data, 2) // isOn if bit 2 is set

    if (result.astro === true) {
      result.sunRise = this.bitTest(data, 5)
      result.preEvent = this.bitTest(data, 6)
      data = data >>> 7 // Shift 7 Bits so we have the number of minuts
      result.minutes = data
      result.min = (data % 60)
      result.hour = ((data - result.min) / 60)
    } else {
      data = data >>> 5 // Shift 5 bits right
      result.minutes = data
      result.min = (data % 60)
      result.hour = ((data - result.min) / 60)
    }
    return result
  }

  getProgForDay (data, day) {
    // first shift 4 bits right
    let dData = data >>> 4
    // then shift day 7 days * 3 bits Mon is day 7
    let dayBits = 7 << (day * 3)
    // remove other days bits
    let prog = (dData & dayBits)
    // then shift right with number of days * 3
    return prog >>> (day * 3)
  }

  parseSetSchedule (buffer) {
    let hexVal = buffer.toString('hex')
    let tb = Buffer.alloc(buffer.length + 2)
    tb.write('45', 0, 'hex')
    tb.writeUInt8(buffer.length, 1)
    tb.write(hexVal, 2, 'hex')

    this.pgrBuff = tb.toString('hex') // Save the buffer
    this.debugLog('Parsing schedule informations %s Size is %s', hexVal, buffer.length)
    let ofs = 0
    let prg = 1
    let prgMinSize = 4
    let programs = {}

    ofs += 1// unknow

    let numProgs = (buffer.readUInt8(ofs)) - 1
    ofs += 1
    this.debugLog('Num Programs %s', numProgs)
    let minBufferSz = numProgs * prgMinSize
    if (buffer.length < minBufferSz) {
      this.log.warn('Programm buffer is to small %s must be %s', buffer.length, minBufferSz)
      return
    }
    ofs += 5 // next 5 bits are unknow 00 00 00 00 00

    while (prg <= numProgs) {
      this.debugLog('Parsing Program %s', prg)
      let program = {}
      program.events = []

      let evStat = buffer.readUInt16LE(ofs) // next 2 bits are control data LittleEndian
      ofs += 2

      let numEvents = evStat >>> 7 /// shift 7 bits to find the number of events
      let evCnt = 1
      this.debugLog('Events : %s', numEvents)
      while (evCnt <= numEvents) {
        // loop thru number of events
        this.debugLog('Event : %s', evCnt)
        let data = buffer.readUInt16LE(ofs)
        let ev = this.parseProgramEvent(data)
        program.events.push(ev)
        ofs += 2
        evCnt += 1
      }
      programs[prg] = program
      prg += 1
    }
    return programs
  }

  schedulerOnOff () {
    if (this.isSchedulerOn) {
      return '4411050C'
    } else {
      return '44110502'
    }
  }

  getDayControlData () {
    let buf = Buffer.alloc(15)
    if (this.dayData) {
      buf.write('465405cd1b2c9f', 0, 'hex')
      buf.writeUInt32LE(this.dayData, 8)
    } else {
      buf.write('465405D31B2C1F00', 0, 'hex')
    }
    return buf.toString('hex')
  }

  // callback function that is bound to SET ProgramCommand
  cbSetProgramCommand (val) {
    this.debugLog('SET ProgramCommand:')
    let buf = Buffer.from(val, 'base64')
    let length = buf.length
    let ofs = 0
    let hexVal = buf.toString('hex')
    this.debugLog('Data stream: %s', hexVal)

    // parsing data stream
    let opcode = 0
    while (ofs < length) {
      opcode = buf.readUInt8(ofs)
      ofs += 1
      switch (opcode) {
        case 0x20: { // Status_LED
          let status = buf.readUInt16LE(ofs)
          this.debugLog('LED %s', status)
          break
        }
        case 0x44: {
          let onOff = buf.readUInt32LE(ofs)
          this.isSchedulerOn = this.bitTest(onOff, 16)
          this.debugLog('Scheduler is on %s', this.isSchedulerOn)
          ofs += 3
          break
        }
        case 0x45: { // Start of Program
          let sz = buf.readUInt8(ofs) // Size of the TimeStamps
          ofs += 1
          this.debugLog('Size : %s', sz)
          let prgBuff = buf.slice(ofs, ofs + sz)
          this.programs = this.parseSetSchedule(prgBuff)
          this.debugLog('Programs %s', JSON.stringify(this.programs))
          ofs += sz
          break
        }
        case 0x46: { // Day settings for Programs
          ofs += 5 // next 5 bytes are unknown
          this.dayData = buf.readUInt32LE(ofs) // 4 bits for daycontrol
          this.debugLog('DayControlData %s', this.dayData)
          ofs += 4
          this.debugLog('Mo : Prog Num %s', this.getProgForDay(this.dayData, 0))
          this.debugLog('Tu : Prog Num %s', this.getProgForDay(this.dayData, 1))
          this.debugLog('We : Prog Num %s', this.getProgForDay(this.dayData, 2))
          this.debugLog('Th : Prog Num %s', this.getProgForDay(this.dayData, 3))
          this.debugLog('Fr : Prog Num %s', this.getProgForDay(this.dayData, 4))
          this.debugLog('Sa : Prog Num %s', this.getProgForDay(this.dayData, 5))
          this.debugLog('So : Prog Num %s', this.getProgForDay(this.dayData, 6))
        }
      }
    }
  }
*/

  static channelTypes () {
    return ['SWITCH', 'STATUS_INDICATOR', 'SWITCH_VIRTUAL_RECEIVER']
  }

  static serviceDescription () {
    return 'This service provides a switch'
  }

  static configurationItems () {
    return {}
  }
}

module.exports = HomeMaticProgrammableSwitchAccessory
