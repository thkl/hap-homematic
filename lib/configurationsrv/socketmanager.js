const sockjs = require('sockjs')

class SocketManager {



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
            conn.on('close', () => {
                self.log.debug('Socked Close Message for %s', conn.id)
                self.handleSocketRequest(conn, {
                    command: 'close'
                });
            });

            conn.on('data', (message) => {
                try {
                    self.handleSocketRequest(conn, JSON.parse(message))
                } catch (e) {

                }
            })
        })

        this.sockjsServer.installHandlers(server, {
            prefix: '/websockets'
        });

        this.connections = {}
        this.log.info('Config Start heartBeat')
    }

    async handleSocketRequest(conn, message) {
        if (message.command === 'hello') {
            this.log.debug('[Config] add %s to sockets', conn.id)
            this.connections[conn.id] = conn
            if (this.getSystemInfo) {
                // Send hello
                let sysData = await this.getSystemInfo()
                conn.write(JSON.stringify({ message: 'ackn', payload: sysData }))
            }
        }

        if (message.command === 'close') {
            if (this.connections[conn.id] !== undefined) {
                this.log.debug('[Config] remove %s from sockets', conn.id)
                delete this.connections[conn.id]
            }
        }
    }

    sendMessageToSockets(message) {
        let self = this
        Object.keys(this.connections).map((connId) => {
            let conn = self.connections[connId]
            try {
                if (conn) {
                    conn.write(JSON.stringify(message))
                }
            } catch (error) {
                if (conn) {
                    try {
                        conn.close()
                    } catch (error) { }
                }
            }
        })
    }
}

// export a singleton
exports = module.exports = new SocketManager();