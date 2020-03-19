import { Network } from './network.js'

export class Localization {
  constructor (language) {
    this.language = language
  }

  init () {
    let self = this
    return new Promise((resolve, reject) => {
      self.phrases = {}
      let network = new Network()
      network.makeRequest('./assets/' + self.language + '.json', 'GET', {}).then(result => {
        if (result) {
          self.phrases = result
          resolve()
        } else {
          reject(new Error('Unable to load Localization'))
        }
      })
    })
  }

  localizePage () {
    let self = this
    $('[data-localize]').each(function () {
      let element = $(this)
      let key = element.attr('data-localize')
      if ((key) && (key !== '')) {
        let value = self.localize(key)
        element.html(value)
      }
    })
  }

  localize () {
    var args = Array.prototype.slice.call(arguments)
    if ((this.phrases[args[0]] === undefined) && (args[0] !== undefined) && (args[0] !== '')) {
      console.warn('No translation for ' + args[0])
    }

    var msg = this.phrases[args[0]] || args[0]
    var rep = args.slice(1, args.length)
    if (rep.length > 0) {
      var i = 0
      var output = msg
      if ((typeof msg) === 'string') {
        output = msg.replace(/%s/g, function (match, idx) {
          var subst = rep.slice(i, ++i)
          return subst.toString()
        })
      }
      return output
    } else {
      return msg
    }
  }
}
