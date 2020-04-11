class HomeMaticAddress {
  constructor (intf, serial, chid, dpn, varname) {
    if (varname) {
      this.varname = varname
    } else {
    // Check if serial chid and dpn are undefiened so we will construct a address from intf
      if ((serial === undefined) && (chid === undefined) && (dpn === undefined)) {
        let rgx = /([a-zA-Z0-9-]{1,}).([a-zA-Z0-9-]{1,}):([0-9]{1,}).([a-zA-Z0-9-_]{1,})/g
        let parts = rgx.exec(intf)
        if ((parts) && (parts.length > 4)) {
          this.intf = parts[1]
          this.serial = parts[2]
          this.channelId = parseInt(parts[3])
          this.dpName = parts[4]
        }
      } else {
        this.intf = intf
        this.serial = serial
        this.channelId = parseInt(chid)
        this.dpName = dpn
      }
    }
  }

  address () {
    return this.intf + '.' + this.serial + ':' + this.channelId + '.' + this.dpName
  }

  variable () {
    return this.varname
  }

  isValid () {
    return (
      (this.intf !== undefined) &&
              (this.serial !== undefined) &&
              (typeof this.channelId === 'number') &&
              (this.dpName !== undefined)
    )
  }

  match (hmAddress) {
    return (
      (this.intf === hmAddress.intf) &&
              (this.serial === hmAddress.serial) &&
              (this.channelId === hmAddress.channelId) &&
              (this.dpName === hmAddress.dpName)
    )
  }
}

module.exports =
      HomeMaticAddress
