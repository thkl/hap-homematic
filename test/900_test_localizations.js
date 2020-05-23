const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('HAP-Homematic Localization Tests', () => {
  this.regEx = /.__\('([^,][^']*)/g
  this.regExIndex = /data-localize="(.*)"/g

  let locFile = path.join(__dirname, '..', 'lib', 'configurationsrv', 'html', 'assets', 'de.json')
  if (fs.existsSync(locFile)) {
    this.localizations = JSON.parse(fs.readFileSync(locFile))
    this.localizations[''] = ' ' // add a dummy
  }

  it('HAP-Homematic check application.js', (done) => {
    // load the file
    let file = path.join(__dirname, '..', 'lib', 'configurationsrv', 'html', 'js', 'application.js')
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file)
      var m
      // split
      do {
        m = this.regEx.exec(content)
        if (m) {
          assert.ok(this.localizations[m[1]], m[1] + ' has no localization')
        }
      } while (m)
    }

    done()
  })

  it('HAP-Homematic check wizzard.js', (done) => {
    // load the file
    let file = path.join(__dirname, '..', 'lib', 'configurationsrv', 'html', 'js', 'wizzards.js')
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file)
      var m
      // split
      do {
        m = this.regEx.exec(content)
        if (m) {
          assert.ok(this.localizations[m[1]], m[1] + ' has no localization')
        }
      } while (m)
    }

    done()
  })

  it('HAP-Homematic check welcomewizzard.js', (done) => {
    // load the file
    let file = path.join(__dirname, '..', 'lib', 'configurationsrv', 'html', 'js', 'welcomewizzard.js')
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file)
      var m
      // split
      do {
        m = this.regEx.exec(content)
        if (m) {
          assert.ok(this.localizations[m[1]], m[1] + ' has no localization')
        }
      } while (m)
    }

    done()
  })

  it('HAP-Homematic check index.html', (done) => {
    // load the file
    let file = path.join(__dirname, '..', 'lib', 'configurationsrv', 'html', 'index.html')
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file)
      var m
      // split
      do {
        m = this.regExIndex.exec(content)
        if (m) {
          assert.ok(this.localizations[m[1]], m[1] + ' has no localization')
        }
      } while (m)
    }

    done()
  })

  it('HAP-Homematic check all service files ', (done) => {
    // load the file

    let items = fs.readdirSync(path.join(__dirname, '..', 'lib', 'services'))
    items.map(item => {
      if (item.match(/HomeMatic.*Accessory.js/)) {
        let test = require(path.join(__dirname, '..', 'lib', 'services', item))
        let serviceDescription = test.serviceDescription()
        assert.ok(this.localizations[serviceDescription], serviceDescription + ' has no localization')
        let configurationItems = test.configurationItems()
        Object.keys(configurationItems).map((key) => {
          let cItem = configurationItems[key]
          // check label
          assert.ok(this.localizations[cItem.label], cItem.label + ' has no localization')
          // chekc hint
          assert.ok(this.localizations[cItem.hint], cItem.hint + ' has no localization in ' + item)
        })
      }
    })
    done()
  })
})
