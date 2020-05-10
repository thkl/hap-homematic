/**
 * hm_addon.js Node version of hm_addon command
 * creates or removes a button from homematic webui system page
 * usage : node hm_addon.js uid [configfile]
 * 2020 by thkl https://github.com/thkl
 *
 */

const fs = require('fs')
let cfgFileName = '/etc/config/hm_addons.cfg'
let regex = /(.*?) \{CONFIG_URL (.*?) CONFIG_DESCRIPTION \{de (.*?) en (.*?)\} ID (.*?) CONFIG_NAME (.*?)\} /g
var m
var items = {}
var addItem
// First parameter is the uid  second the config
var myArgs = process.argv.slice(2)
if (myArgs.length === 0) {
  console.log('usage : hm_addon.js uid [configfile]')
  process.exit(-1)
}

let uid = myArgs[0]
if (myArgs.length === 2) {
  if (fs.existsSync(myArgs[1])) {
    var buffer = fs.readFileSync(myArgs[1], 'utf8')
    let tmp = JSON.parse(buffer.toString())
    addItem = {
      'uid': uid.toLocaleLowerCase(),
      'url': tmp.CONFIG_URL,
      'de': tmp.CONFIG_DESCRIPTION.de,
      'en': tmp.CONFIG_DESCRIPTION.en,
      'id': tmp.ID,
      'name': tmp.CONFIG_NAME
    }
  } else {

  }
}

if (fs.existsSync(cfgFileName)) {
  let contents = fs.readFileSync(cfgFileName, 'utf8')
  if (contents.slice(-1) !== ' ') {
    contents = contents + ' ' // add a space for easyer parsing
  }
  do {
    m = regex.exec(contents)
    if (m) {
      let item = {
        'uid': m[1].toLocaleLowerCase(),
        'url': m[2],
        'de': m[3],
        'en': m[4],
        'id': m[5],
        'name': m[6]
      }
      items[m[1]] = item
    }
  } while (m)
}

if (addItem !== undefined) {
  items[uid] = addItem
  console.log('add %s', uid)
} else {
  delete items[uid]
  console.log('remove %s', uid)
}
var strout = ''
Object.keys(items).forEach(key => {
  let item = items[key]
  // check remove config there is no config and the uid did not match the given uid
  strout = strout + item.uid.toLocaleLowerCase() + ' {CONFIG_URL ' + item.url + ' CONFIG_DESCRIPTION {de ' + item.de
  strout = strout + ' en ' + item.en + '} ID ' + item.id + ' CONFIG_NAME ' + item.name + '} '
})
fs.writeFileSync(cfgFileName, strout, 'utf8')
