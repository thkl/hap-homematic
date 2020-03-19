import { Network } from './network.js'

export class Localization {
  constructor (language) {
    if (language === undefined) {
      language = (navigator.language || navigator.userLanguage).toLowerCase()
    }
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
    var msg = args[0]
    if (this.phrases) {
      if ((this.phrases[msg] === undefined) && (msg !== undefined) && (msg !== '')) {
        console.warn('No translation for ' + msg)
      }

      msg = this.phrases[msg] || msg
    }
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
