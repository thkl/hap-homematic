'use strict'

var util = require('util')

let hap

module.exports = class CustomHomeKitTypes {
  constructor (homebridge) {
    hap = homebridge.homebridge.hap
    this.Characteristic = {}
    this.Service = {}
  }

  createCharacteristic (name, uuid, props, displayName = name) {
    this.Characteristic[name] = function () {
      hap.Characteristic.call(this, displayName, uuid)
      this.setProps(props)
      this.value = this.getDefaultValue()
    }
    util.inherits(this.Characteristic[name], hap.Characteristic)
    this.Characteristic[name].UUID = uuid
  }

  createService (name, uuid, Characteristics, OptionalCharacteristics = []) {
    this.Service[name] = function (displayName, subtype) {
      hap.Service.call(this, displayName, uuid, subtype)
      for (const Characteristic of Characteristics) {
        this.addCharacteristic(Characteristic)
      }
      for (const Characteristic of OptionalCharacteristics) {
        this.addOptionalCharacteristic(Characteristic)
      }
    }
    util.inherits(this.Service[name], hap.Service)
    this.Service[name].UUID = uuid
  }
}
