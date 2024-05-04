const assert = require('assert')
const path = require('path')
const fs = require('fs')

describe('HAP-Homematic Localization Tests', () => {
  this.regEx = /.__\('([^,][^']*)/g
  this.regExIndex = /data-localize="(.*)"/g

  let locFile = path.join(__dirname, '..', 'lib', 'configurationsrv', 'localization', 'de.json')
  if (fs.existsSync(locFile)) {
    this.localizations = JSON.parse(fs.readFileSync(locFile).toString())
    this.localizations[''] = ' ' // add a dummy
    console.log(`Using Localization from ${locFile}`);
  }

  it('HAP-Homematic check all service files ', (done) => {
    // load the file

    let items = fs.readdirSync(path.join(__dirname, '..', 'lib', 'services'))
    items.map(item => {
      if (item.match(/HomeMatic.*Accessory.js/)) {
        let test = require(path.join(__dirname, '..', 'lib', 'services', item))
        let serviceDescription = test.serviceDescription()
        assert.ok(this.localizations[serviceDescription] !== undefined, `serviceDescription ${serviceDescription}  has no localization for ${item}`)
        let configurationItems = test.configurationItems()
        Object.keys(configurationItems).map((key) => {
          let cItem = configurationItems[key]
          // check label
          if (cItem.label !== undefined) {
            assert.ok(this.localizations[cItem.label], `Label for ${cItem.label} has no localization in ${item}`);
          }
          if (cItem.hint !== undefined) {
            // chekc hint
            assert.ok(this.localizations[cItem.hint], `Hint for ${cItem.hint} has no localization in ${item}`);
          }
        })
      }
    })
    done()
  })
})
