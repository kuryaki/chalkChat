var socketIO = require('socket.io')
  , socketioJwt = require('socketio-jwt')
  , logger = require('../utils/logger')

module.exports = function(http) {
  var io = socketIO(http)

  io.use(socketioJwt.authorize({
    secret: process.env.JWT_SECRET,
    handshake: true
  }))

  io.on('error', logger.error)

  io.on('connection', function (socket) {
    socket.on('message', function(){
      console.log(arguments)
    })
  })

  return io
}