'use strict'

const CustomHomeKitTypes = require('./CustomHomeKitTypes.js')

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
  }
}
