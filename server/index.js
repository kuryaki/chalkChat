var express = require('express')
  , cors = require('cors')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , app = express()
  , jwt = require('express-jwt')
  , logger = require("./utils/logger")
  , http = require('http').Server(app)
  , io = require('socket.io')(http)
  , morgan = require('morgan')
  , env = require('dotenv')

env.load()

app.use(cors())
app.use(morgan('dev', { "stream": logger.stream }))
app.use(express.static(__dirname + '/public'))
app.use(jwt({ secret: process.env.JWT_SECRET || 'default-secret'}).unless({path: ['/login']}))

app.use(function (err, req, res, next) { // TODO make test and util/lib/middleware
  if (err.name === 'UnauthorizedError') { 
    res
    .redirect('/login')
  }
})

app.get('/login', function(req, res){ // TODO move to router
  res
  .status(200)
  .send('login form')
})


io.on('connection', function(socket){
  logger.debug('a user connected')
  socket.on('disconnect', function(){
    logger.debug('user disconnected')
  })
})

http.listen(3000, function(){
	logger.debug('listening on *:3000')
})
