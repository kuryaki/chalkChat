var express = require('express')
  , router = express.Router()
  , jwt = require('jsonwebtoken')
  , User = require('../models/user')


router.post('/', function(req, res, next) {
  User.findByUsername(req.body.username, function(error, user){
    if(error){ return next(error) }
    if(user){ return res.status(400).send({error:'User already exists, please sign in'}) }

    var user = new User(req.body)
    user.save(function(error, ok){
      if(error) { return next(error) }
      
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

    })
      
  })
})

module.exports = router