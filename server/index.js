var express = require('express')
  , cors = require('cors')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , app = express()
  , jwt = require('express-jwt')
  , logger = require('./utils/logger')
  , errorManager = require('./utils/errors')
  , http = require('http').Server(app)
  , morgan = require('morgan')
  , authRoutes = require('./routes/auth')
  , env = require('dotenv')

env.load()


app.use(bodyParser.json())
app.use(cors())
app.use(express.static(__dirname + '/public'))
app.use(jwt({ secret: process.env.JWT_SECRET }).unless({path: ['/login', '/register', '/status']}))

if(process.env.NODE_ENV !== 'test'){
  app.use(morgan('dev', { "stream": logger.stream }))
}

app.set('port', process.env.PORT || 3000)

app.use(errorManager)

app.use('/login', authRoutes)

app.get('/status', function(req, res){
  res.status(200).end()
})
// Endpoint to test for protected endpoints 401 if not authorized, 200 otherwise
app.get('/protected', function(req, res){
  res.status(200).end()
})

http.listen(app.get('port'), function(){
  require('./socket')(http)
  logger.debug('listening on *:'+app.get('port'))
})

module.exports = app
