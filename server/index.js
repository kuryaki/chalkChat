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
  , authRoutes = require('./routes/auth')
  , env = require('dotenv')

env.load()

if(process.env.NODE_ENV !== 'test'){
  app.use(morgan('dev', { "stream": logger.stream }))
}

app.use(bodyParser.json())
app.use(cors())
app.use(express.static(__dirname + '/public'))
app.use(jwt({ secret: process.env.JWT_SECRET }).unless({path: ['/login', '/register', '/status']}))
app.set('port', process.env.PORT || 3000)

app.use(function (err, req, res, next) { // TODO make test and util/lib/middleware
  if (err.name === 'UnauthorizedError') { 
    res
    .status(401)
    .end()
  }
})

app.use('/login', authRoutes)
// Endpoint to test for protected endpoints 401 if not authorized, 200 otherwise
app.get('/status', function(req, res){
  res.status(200).end()
})
app.get('/protected', function(req, res){
  res.status(200).end()
}) 

io.on('connection', function(socket){
  logger.debug('a user connected')
  socket.on('disconnect', function(){
    logger.debug('user disconnected')
  })
})

http.listen(app.get('port'), function(){
	logger.debug('listening on *:'+app.get('port'))
})

module.exports = app
