/*
 * **************************************************************
 * File: httpclient.js
 * Project: hap-homematic
 * File Created: Monday, 4th October 2021 5:13:00 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:23:49 pm
 * Modified By: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Copyright 2020 - 2021 @thkl / github.com/thkl
 * -----
 * **************************************************************
 * MIT License
 * 
 * Copyright (c) 2021 github.com/thkl
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * **************************************************************
 */

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