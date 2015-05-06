var socketIO = require('socket.io')
  , socketioJwt = require('socketio-jwt')
  , logger = require('../utils/logger')
  , IOredis = require('socket.io-redis')
  , User = require('../models/user')

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
    redis.set('chalk:connections:'+socket.decoded_token.username+':'+socket.id)
    socket.on('channel', function(channel){
      // join channel
      socket.join(channel)

      // get the history of the channel
      redis.lrange('chalk:channels:'+channel+':history', 0, 9, function(error, history){
        // refresh the history of the channel
        socket.emit('history', history)
      })

      User.findByUsername(channel, function(error, user){
        if(user){
          var userChannel = socket.decoded_token.username+':'+user.username
          var otherChannel = user.username+':'+socket.decoded_token.username
          // In case channel is user
          // add channel to user list of channels
          redis.sadd('chalk:channels:'+socket.decoded_token.username, userChannel, function(){
            // list the channels for current user
            redis.smembers('chalk:channels:'+socket.decoded_token.username, function(error, channels){
              // refresh the list of channels for current user
              socket.emit('channels', channels)
            })
          })

          // add channel to other user list of channels
          redis.sadd('chalk:channels:'+user.username, otherChannel, function(){
            // list the channels for other user
            redis.smembers('chalk:channels:'+user.username, function(error, channels){
              // refresh the list of channels for other user
              redis.get('chalk:connections:'+socket.decoded_token.username+':'+socket.id, function(error, otherSocketId){
                socket.broadcast.to(otherSocketId).emit('channels', channels)
              })
            })
          })

          // receive chat on channel
          socket.on(channel, function(message){
            // add to user history
            redis.rpush('chalk:channels:'+userChannel+':history', socket.decoded_token.username+':'+message)
            // add to other user history
            redis.rpush('chalk:channels:'+otherChannel+':history', user.username+':'+message)
            // limit history to 100
            redis.ltrim('chalk:channels:'+userChannel+':history', 0, 99)
            redis.ltrim('chalk:channels:'+otherChannel+':history', 0, 99)
            // broadcast message to channel
            redis.get('chalk:connections:'+socket.decoded_token.username+':'+socket.id, function(error, otherSocketId){
              socket.broadcast.to(otherSocketId).emit('chat', {from:socket.decoded_token.username, message: message, channel: otherChannel})
            })
          })

        }else{
          // In case its not an user
          // add channel to user list of channels
          redis.sadd('chalk:channels:'+socket.decoded_token.username, channel, function(){
            // list all channels
            redis.smembers('chalk:channels:'+socket.decoded_token.username, function(error, channels){
              // refresh the list of channels
              socket.emit('channels', channels)
            })
          })

          // receive chat on channel
          socket.on(channel, function(message){
            // add to history
            redis.rpush('chalk:channels:'+channel+':history', socket.decoded_token.username+':'+message)
            // limit history to 100
            redis.ltrim('chalk:channels:'+channel+':history', 0, 99)
            // broadcast message to channel
            socket.broadcast.to(channel).emit('chat', {from:socket.decoded_token.username, message: message, channel: channel})
          })
        }

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