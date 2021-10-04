const http = require('http');
const https = require('https');
const url = require('url');


class HTTP {


    // make it fucking Node8 compatible
    get(urlStr, options) {
        return new Promise((resolve, reject) => {
            if (!options) {
                options = {}
            }
            const q = url.parse(urlStr, true)
            options.path = q.pathname
            options.host = q.hostname
            options.port = q.port
            let httpClient = http;
            if (q.protocol === 'https:') {
                httpClient = https;
            }


            httpClient.get(options, (resp) => {
                let data = ''

                resp.on('data', (chunk) => {
                    data += chunk
                })

                resp.on('end', () => {
                    resolve(data)
                })
            }).on('error', (err) => {
                reject(err)
            })
        })
    }

    getJSON(urlStr, options) {
        const self = this
        return new Promise((resolve, reject) => {
            self.get(urlStr, options).then(res => {
                try {
                    resolve(JSON.parse(res))
                } catch (e) {
                    reject(e)
                }
            }).catch((e) => {
                reject(e)
            })
        })
    }
}

exports = module.exports = new HTTP();