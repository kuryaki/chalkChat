
var redis = require('redis').createClient(process.env.REDIS_PORT || 6379, process.env.REDIS_HOST || 'localhost')
  , crypto = require('crypto')
  , jsonschema = require('jsonschema')

var userSchema = {
  title: 'User schema',
  type: 'Object',
  properties: {
    username: {
      type: 'string'
    },
    password: {
      type: 'string'
    }
  },
  required: ['username', 'password']
}

/**
 * Hasher function to calculate password hash
 * @param  {[String]} password
 * @param  {[Sting]}  salt
 * @return {[Sting]}  Hash
 */
function hasher (password, salt) {
  var hash = crypto.createHash('sha512')
  hash.update(password)
  hash.update(salt)
  return hash.digest('base64')
}

function User(user){
  try{
    jsonschema.validate(user, userSchema, { throwError: true })
  } catch(e){
    throw new jsonschema.SchemaError(e)
  }

  this.username = user.username
  this.salt = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
  this.password = hasher(user.password, this.salt)
  this.avatar = 'http://api.adorable.io/avatars/'+user.username

  return this
}

User.prototype.save = function(next){
  var self = this
  redis.hgetall('chalk:users:'+self.username, function(error, user){
    if(error){ return next(error) }
    if(user){ return next(new Error('duplicated')) }
    redis.hmset('chalk:users:'+self.username, self, next)
  })
}

User.prototype.delete = function(next){
  redis.del('chalk:users:'+this.username, next)
}

User.prototype.validatePassword = function(password){
  return hasher(password, this.salt) === this.password
}

User.findByUsername = function(username, next){
  redis.hgetall('chalk:users:'+username, function(error, user){
    if(error) { next(error) }
    if(user) {
      user.__proto__ = User.prototype
      next(null, user)
    } else {
      next(null, null)
    }
  })
}

module.exports = User