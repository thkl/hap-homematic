/*
 * File: HomeMaticAddress.js
 * Project: hap-homematic
 * File Created: Saturday, 7th March 2020 2:20:09 pm
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
