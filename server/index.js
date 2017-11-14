const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const ioConn = require('./socket')

const app = express()
const httpServer = http.Server(app)
const io = socketio(httpServer)

app.use(express.static('public'))

httpServer.listen(3000, () => {
  console.log('listening on *:3000')
})
