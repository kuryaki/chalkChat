process.env.PORT = 4000
process.env.NODE_ENV = 'test'

var io = require('socket.io-client')
  , socketURL = 'http://0.0.0.0:'+process.env.PORT
  , server = require('../../app')
  , supertest = require('supertest')
  , request = supertest(server)
  , expect = require('chai').expect
  , User = require('../../models/user')

var options = {
  transports: ['websocket'],
  'force new connection': true
}

var token = ''

describe('Socket Server connection', function(){
  before(function(done){
    var user = new User({username:'david', password:'password'})
    user.save(function(error, ok){
      request
      .post('/login')
      .send({username:'david', password:'password'})
      .expect(200)
      .end(function(err, res){
        if (err) return done(err)
        options.query = 'token='+res.body.token
        done()
      })
    })
  })

  it('should connect', function(done){
    var socket = io.connect(socketURL, options)
    socket.on('connect', function(){
      done()
    })

  })

  after(function(done){
    User.findByUsername('david', function(error, user){
      user.delete(function(error, ok){
        done()
      })
    })
  })

})