/*
 * File: EveHomeKitTypes.js
 * Project: hap-homematic
 * File Created: Sunday, 8th March 2020 3:50:10 pm
 * Author: Thomas Kluge (th.kluge@me.com)
 * Eve Implementation see fakegato : https://github.com/simont77/fakegato-history
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
'use strict'

const CustomHomeKitTypes = require('./CustomHomeKitTypes.js')
const uuid = require('hap-nodejs').uuid
let hap

module.exports = class EveHomeKitTypes extends CustomHomeKitTypes {
  constructor (homebridge) {
    super(homebridge)
    hap = homebridge.homebridge.hap

    this.createCharacteristic('OpenDuration', 'E863F118-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT32,
      unit: hap.Characteristic.Units.SECONDS,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY, hap.Characteristic.Perms.WRITE]
    })

    this.createCharacteristic('ClosedDuration', 'E863F119-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT32,
      unit: hap.Characteristic.Units.SECONDS,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY, hap.Characteristic.Perms.WRITE]
    })

    this.createCharacteristic('ResetTotal', 'E863F112-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT32,
      unit: hap.Characteristic.Units.SECONDS,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY, hap.Characteristic.Perms.WRITE]
    })

    this.createCharacteristic('TimesOpened', 'E863F129-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT32,
      unit: hap.Characteristic.Units.SECONDS,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('LastActivation', 'E863F11A-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT32,
      unit: hap.Characteristic.Units.SECONDS,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createCharacteristic('ElectricCurrent', 'E863F126-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.FLOAT,
      unit: 'A',
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    }, 'Electric Current')

    this.createCharacteristic('ElectricPower', 'E863F10D-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UINT16,
      unit: 'W',
      maxValue: 100000,
      minValue: 0,
      minStep: 1,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    }, 'Electric Power')

    this.createCharacteristic('TotalConsumption', 'E863F10C-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UInt16,
      unit: 'kWh',
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    }, 'Total Consumption')

    this.createCharacteristic('Voltage', 'E863F10A-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.UInt16,
      unit: 'V',
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.NOTIFY]
    })

    this.createService('PowerMeterService', 'E863F117-079E-48FF-8F27-9C2605A29F52', [
      this.Characteristic.ResetTotal,
      this.Characteristic.ElectricPower,
      this.Characteristic.TotalConsumption,
      this.Characteristic.Voltage,
      this.Characteristic.ElectricCurrent
    ])

    this.createService('EnergyMeterService', uuid.generate('HomeMatic:customdevice:EnergyMeterService'), [
      this.Characteristic.ResetTotal,
      this.Characteristic.TotalConsumption
    ])
  }
}
