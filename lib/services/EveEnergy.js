/*

Logging
Name (Read Only)
00000023-0000-1000-8000-0026BB765291
Logging

Custom
E863F11E-079E-48FF-8F27-9C2605A29F52 // Firmware Info
{length = 18, bytes = 0x1f00010e2400b8040a006c0891f04e7d9a22}

Custom (Read Only)
E863F131-079E-48FF-8F27-9C2605A29F52
{length = 159, bytes = 0x00022400 0302b804 040c4256 30334a31 ... 9b04fc06 0000d200 }

Custom (Write Only)
E863F11D-079E-48FF-8F27-9C2605A29F52
{length = 38, bytes = 0x47110573 1b451cdf 1cb81db4 0000003c ... f3215242 a5535341 }

*/

'use strict'

const CustomHomeKitTypes = require('./CustomHomeKitTypes.js')

let hap

module.exports = class EveHomeKitEnergyTypes extends CustomHomeKitTypes {
  constructor (globalHap) {
    super(globalHap)
    hap = globalHap

    this.createCharacteristic('FirmwareInfo', 'E863F11E-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.DATA,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.WRITE, hap.Characteristic.Perms.HIDDEN]
    })

    this.createCharacteristic('ProgramInfo', 'E863F131-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.DATA,
      perms: [hap.Characteristic.Perms.READ, hap.Characteristic.Perms.HIDDEN]
    })

    this.createCharacteristic('ProgramData', 'E863F11D-079E-48FF-8F27-9C2605A29F52', {
      format: hap.Characteristic.Formats.DATA,
      perms: [hap.Characteristic.Perms.WRITE, hap.Characteristic.Perms.HIDDEN]
    })
  }
}
