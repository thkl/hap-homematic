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

    async handleSocketRequest(conn, message) {

        if (message.command === 'hello') {
            this.connections[conn.id] = conn
            conn.write(JSON.stringify({ message: 'ackn', payload: {} }));
        }

        if (message.command === 'close') {
            if (this.connections[conn.id] !== undefined) {
                this.log.debug('[Config] remove %s from sockets', conn.id)
                delete this.connections[conn.id]
            }
        }
    }

    sendMessageToSockets(message) {
        this.log.debug('send socket message %s', message)
        let self = this
        Object.keys(this.connections).map((connId) => {
            let conn = self.connections[connId]
            try {
                if (conn) {
                    if (typeof message === 'string') {
                        conn.write(message)
                    } else {
                        conn.write(JSON.stringify(message));
                    }
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