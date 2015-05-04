process.env.PORT = 4000
process.env.NODE_ENV = 'test'

var server = require('../../')
  , supertest = require('supertest')
  , request = supertest(server)
  , expect = require('chai').expect
  , User = require('../../models/user')

describe('Status', function(){
  it('should show live status', function(done){
    request.get('/status').expect(200).end(done)
  })
})

describe('Auth', function(){
  before(function(done){
    var user = new User({username:'david', password:'password'})
    user.save(function(error, ok){
      done()
    })
  })

  it('should protect a protected endpoint', function(done){
    request.get('/protected').expect(401).end(done)
  })

  it('should not authenticate invalid credentials', function(done){
    request
    .post('/login')
    .send({username:'david', password:'badPassword'})
    .expect(401)
    .end(done)
  })

  it('should authenticate valid credentials', function(done){
    request
    .post('/login')
    .send({username:'david', password:'password'})
    .expect(200)
    .end(function(err, res){
      if (err) return done(err)
      expect(res.body).to.have.property('token')
      done()
    })
  })

  it('should show a protected after authenticate', function(done){
    request
    .post('/login')
    .send({username:'david', password:'password'})
    .expect(200)
    .end(function(err, res){
      if (err) return done(err)
      request
      .get('/protected')
      .set('Authorization', 'Bearer '+res.body.token)
      .expect(200).end(done)
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

