var assert = require('chai').assert
  , expect = require('chai').expect
  , User = require('../../models/user')


describe('User Model Test', function(){
  it('should create an user with a hashed password', function(done){
    var user = new User({username:'david', password:'password'})
    expect(user).to.be.an('object')
    expect(user).to.have.property('username').to.equal('david')
    expect(user).to.have.property('password').to.be.a('string')
    expect(user).to.have.property('salt').to.be.a('string')
    done()
  })
  it('should save an user', function(done){
    var user = new User({username:'david', password:'password'})
    user.save(function(error, ok){
      expect(error).to.equal(null)
      done()
    })
  })
  it('should error a duplicated user', function(done){
    var user = new User({username:'david', password:'password'})
    user.save(function(error, ok){
      expect(error).to.eql(new Error('duplicated'))
      done()
    })
  })
  it('should find an existing user', function(done){
    User.findByUsername('david', function(error, user){
      expect(user).to.be.an('object')
      expect(user).to.have.property('username').to.equal('david')
      done()
    })
  })
  it('should not validate a wrong password', function(done){
    User.findByUsername('david', function(error, user){
      var valid = user.validatePassword('badPassword')
      expect(valid).to.be.false
      done()
    })
  })
  it('should validate a good password', function(done){
    User.findByUsername('david', function(error, user){
      var valid = user.validatePassword('password')
      expect(valid).to.be.true
      done()
    })
  })
  it('should delete an existing user', function(done){
    User.findByUsername('david', function(error, user){
      user.delete(function(error, ok){
        expect(error).to.equal(null)
        done()
      })
    })
  })
})