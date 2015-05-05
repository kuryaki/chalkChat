var token = ''

$( "#signIn" ).click(function(event) {
  event.preventDefault()
  var data = $('#authForm').serializeArray().reduce(function(obj, item) {
    obj[item.name] = item.value
    return obj
  }, {})
  if(!data.username){
    return alert('Missing username!')
  }
  if(!data.password){
    return alert('Missing password!')
  }
  request({method:'POST', url:'/login', body:data, json:true}, function(error, response, body){
    if(error){
      return alert(error)
    }
    if(response.statusCode !== 200){
      return alert(body.error)
    }
    token = body.token
    $( "#auth" ).hide()
    $( "#chat" ).show()
  })
})

$( "#signUp" ).click(function(event) {
  event.preventDefault()
  var data = $('#authForm').serializeArray().reduce(function(obj, item) {
    obj[item.name] = item.value
    return obj
  }, {})
  if(!data.username){
    return alert('Missing username!')
  }
  if(!data.password){
    return alert('Missing password!')
  }

  $('#passwordConfirm').modal('show')

})

$( "#signUpConfirm" ).click(function(event) {
  event.preventDefault()
  var data = $('#authForm').serializeArray().reduce(function(obj, item) {
    obj[item.name] = item.value
    return obj
  }, {})

  if(data.password !== data.confirm){
    return alert('Password does not match!')
  }

  delete data.confirm

  request({method:'POST', url:'/register', body:data, json:true}, function(error, response, body){
    if(error){
      return alert(error)
    }
    if(response.statusCode !== 200){
      return alert(body.error)
    }
    token = body.token
    $( "#auth" ).hide()
    $( "#chat" ).show()
  })
})