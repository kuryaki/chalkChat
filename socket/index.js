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
    // TODO redis add general to user channels

    socket.on('channel', function(channel){
      socket.join(channel)
      redis.sadd('chalk:channels:'+socket.decoded_token.username, channel, function(){
        redis.smembers('chalk:channels:'+socket.decoded_token.username, function(error, channels){
          socket.emit('channels', channels)
        })
      })
      redis.lrange('chalk:channels:'+channel+':history', 0, 9, function(error, history){
        socket.emit('history', history)
      })
      socket.on(channel, function(message){
        redis.rpush('chalk:channels:'+channel+':history', socket.decoded_token.username+':'+message)
        redis.ltrim('chalk:channels:'+channel+':history', 0, 99)
        socket.broadcast.to(channel).emit('chat', {from:socket.decoded_token.username, message: message, channel: channel})
      })
    })
  })

  return io
}

function done(error){
  if(error){
    logger.error(error)
  }
}