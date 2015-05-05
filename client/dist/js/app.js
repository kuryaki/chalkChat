var user = { username: 'default' }

// Auth Logic
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
    user.token = body.token
    user.username = data.username
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
    user.token = body.token
    user.username = data.username
    $( "#auth" ).hide()
    $( "#chat" ).show()
  })
})

// Chat login

$( "#btn-chat" ).click(function(event) {
  event.preventDefault()
  var selfMessage = '<li class="right clearfix"><span class="chat-img pull-right"><img src="http://api.adorable.io/avatars/50/'+user.username+'" alt="User Avatar" class="img-circle" /></span><div class="chat-body clearfix"><div class="header"><small class=" text-muted"><i class="fa fa-upload-o fa-fw"></i> </small><strong class="pull-right primary-font">'+user.username+'</strong></div><p>'+$( "#btn-input" ).val()+'</p></div></li>'
  $("#chatHistory").append(selfMessage)
  $( "#btn-input" ).attr("placeholder", "Type your message here...").val("").focus().blur()
})