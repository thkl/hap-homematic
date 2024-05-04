/*
 * **************************************************************
 * File: socketmanager.js
 * Project: hap-homematic
 * File Created: Monday, 4th October 2021 2:32:12 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:23:23 pm
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

const sockjs = require('sockjs')
const EventEmitter = require('events')

class SocketManager extends EventEmitter {

    connect(log, server) {
        const self = this;
        this.log = log;

        this.sockjsServer = sockjs.createServer({
            sockjs_url: './assets/js/sockjs.min.js',
            log: function (message) {
                self.log.debug(message)
            }
        });

        this.sockjsServer.on('connection', function (conn) {

            self.log.debug('NewWebSocket Connection')

            conn.on('close', () => {
                self.log.debug('Socked Close Message for %s', conn.id)
                self.handleSocketRequest(conn, {
                    command: 'close'
                });
            });

            conn.on('data', (message) => {
                try {
                    self.log.info('Socket Message %s', message)
                    if (typeof message === 'string') {
                        self.handleSocketRequest(conn, JSON.parse(message))
                    } else {
                        self.handleSocketRequest(conn, message);
                    }
                } catch (e) {
                    console.log(e);
                }
            })

            conn.write(JSON.stringify({ message: 'ackn', payload: {} }));
        })

        this.sockjsServer.installHandlers(server, {
            prefix: '/websockets'
        });

        this.connections = {}
    }

    hasConnections() {
        return (Object.keys(this.connections).length > 0);
    }

    handleSocketRequest(conn, message) {
        if (message.command === 'hello') {
            this.connections[conn.id] = conn
            conn.write(JSON.stringify({ message: 'ackn', payload: {} }));
            this.emit('hello', { connection: conn, command: message.command });
        }

        if (message.command === 'close') {
            if (this.connections[conn.id] !== undefined) {
                this.log.debug('[Config] remove %s from sockets', conn.id)
                delete this.connections[conn.id]
            }
        }
    }

    sendMessageToSocket(connection, message) {
        try {
            if (connection) {
                if (typeof message === 'string') {
                    connection.write(message)
                } else {
                    connection.write(JSON.stringify(message));
                }
            }
        } catch (error) {
            if (connection) {
                try {
                    connection.close()
                } catch (error) { }
            }
        }
    }

    sendMessageToSockets(message) {
        this.log.debug('send socket message %s', message)
        let self = this
        Object.keys(this.connections).map((connId) => {
            let conn = self.connections[connId]
            self.sendMessageToSocket(conn, message);
        })
    }
}

// export a singleton
exports = module.exports = new SocketManager();