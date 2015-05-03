var assert = require('chai').assert
  , foo = 'bar'
  , beverages = { tea: [ 'chai', 'matcha', 'oolong' ] }
  , User = require('../../models/user')


describe('Test', function(){
  it('should not error', function(done){
    assert.typeOf(foo, 'string')
    done()
  })
})