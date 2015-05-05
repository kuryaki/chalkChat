var socketIO = require('socket.io')
  , socketioJwt = require('socketio-jwt')
  , logger = require('../utils/logger')
  , IOredis = require('socket.io-redis')

if (process.env.REDISTOGO_URL) {
  var rtg   = require('url').parse(process.env.REDISTOGO_URL)
  var redis = require('redis').createClient(rtg.port, rtg.hostname)
  redis.auth(rtg.auth.split(':')[1])
} else {
  var redis = require('redis').createClient(process.env.REDIS_PORT || 6379, process.env.REDIS_HOST || 'localhost')
}

module.exports = function(http) {
  var io = socketIO(http)
  io.adapter(IOredis(redis))

  io.use(socketioJwt.authorize({
    secret: process.env.JWT_SECRET,
    handshake: true
  }))

  io.on('error', logger.error)

  io.on('connection', function (socket) {
    logger.info(socket.id)
    socket.join('general')
    // TODO redis add general to user channels
    socket.on('message', function(){
      console.log('message', arguments)
    })
  })

  return io
}