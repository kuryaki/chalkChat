var express = require('express')
  , router = express.Router()
  , jwt = require('jsonwebtoken')
  , User = require('../models/user')


router.get('/', function(req, res){
  res
  .status(200)
  .send('login form')
})

// Issue the jwt token
router.post('/', function(req, res, next) {
  User.findByUsername(req.body.username, function(error, user){
    if(error){ return next(error) }
    if(!user){ return res.status(401).send({error:'Not a registered user please Sign Up'}) }
    if(user.validatePassword(req.body.password)){

      delete user.password
      delete user.salt

      var token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresInMinutes: 1440 // expires in 24 hours
      })

      res
      .cookie('access_token', token, { expires: new Date(Date.now() + 900000), secure: true })
      .status(200)
      .send({
        token: token
      })

    } else {
      return res.status(401).send('invalid')
    }
  })
})

module.exports = router
