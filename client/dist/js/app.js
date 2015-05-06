var user = { }

$(document).ready(function() {
  user = JSON.parse(Cookies.get('chalk_user') || '{"token":""}')
  if(user.token){
    socketAuth()
  }
})

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

    Cookies.set('chalk_user', JSON.stringify(user))

    socketAuth()

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

    Cookies.set('chalk_user', JSON.stringify(user))

    socketAuth()

  })
})

$( "#signOut" ).click(function(event) {
  event.preventDefault()
  $( "#auth" ).show()
  $( "#chat" ).hide()
  Cookies.remove('chalk_user')
})

function socketAuth(){
  var channel = 'general'
  $( "#auth" ).hide()
  // TODO make a spinner

  // Change this url for a proper one
  var socket = io.connect(document.URL, {
    'query': 'token=' + user.token
  })

  socket.on('error', function(error){
    if(error.code === 'invalid_token'){
      $( "#auth" ).show()
    }
    console.log(error)
  })

  socket.on('connect', function(){
    $( "#chat" ).show()

    // Chat login
    
    socket.emit('channel', channel)

    $('#btn-input').keypress(function (e) {
      if (e.which == 13) {
        newMessage()
        return false
      }
    });

    $( "#btn-chat" ).click(newMessage)

    function newMessage() {
      var message = $( "#btn-input" ).val()
      $("#chatHistory").append(getSelfMessage(user.username, message))
      $( "#btn-input" ).attr("placeholder", "Type your message here...").val("").focus().blur()
      $('#chatHistoryContainer').scrollTop($('#chatHistoryContainer')[0].scrollHeight)
      socket.emit(channel, message)
      return false
    }

    socket.on('chat', function(chat){
      if (chat.channel === channel) {
        $("#chatHistory").append(getOtherMessage(chat.from, chat.message))
        $('#chatHistoryContainer').scrollTop($('#chatHistoryContainer')[0].scrollHeight)
      } else {
        //$( "#channel_"+channel ).css("font-weight","Bold")
        console.log('received message on non active window')
      }
    })

    socket.on('history', function(history){
      $("#chatHistory").empty()
      history.forEach(function(chat){
        var username = chat.split(':')[0]
        var message = chat.split(':')[1]
        if (user.username === username) {
          $("#chatHistory").append(getSelfMessage(username, message))
        } else {
          $("#chatHistory").append(getOtherMessage(username, message))
        }
      })
      $('#chatHistoryContainer').scrollTop($('#chatHistoryContainer')[0].scrollHeight)
    })

    socket.on('channels', function(channels){
      $("#conversations").empty()
      channels.reverse().forEach(function(chan){
        $("#conversations").append(getChannel(chan))
      })
      $( "#conversations a" ).click(function(){
        channel = $(this).text().trim().toLowerCase()
        socket.emit('channel', channel)
        return false
      })
    })
    
  })

  $( "#createConversation" ).click(function(){
    $("#newConversationModal").modal('show')
    return false
  })

  $("channel-general").click(function(){
    console.log($(this))
    return false
  })

  $( "#newConversation" ).click(function(){
    channel = $('#newConversationName').val()
    socket.emit('channel', channel)
  })



}

function getChannel(channel){
  return [
  '<a id="channel-'+channel+'" href="#" class="list-group-item">',
  '  <i class="fa fa-comments fa-fw"></i> '+channel.charAt(0).toUpperCase() + channel.slice(1),
  '  </span>',
  '</a>'
  ].join("\n")
}

function getSelfMessage(username, message){
  return [
        '<li class="right clearfix">',
        ' <span class="chat-img pull-right">',
        '   <img src="http://api.adorable.io/avatars/50/'+username+'" alt="User Avatar" class="img-circle" />',
        ' </span>',
        ' <div class="chat-body clearfix">',
        '   <div class="header">',
        '     <small class=" text-muted"><i class="fa fa-upload-o fa-fw"></i> </small>',
        '     <strong class="pull-right primary-font">'+username+'</strong>',
        '   </div>',
        '   <p class="pull-right">'+message+'</p>',
        ' </div>',
        '</li>'
      ].join("\n")
}

function getOtherMessage(username, message){
  return [
          '<li class="left clearfix">',
          ' <span class="chat-img pull-left">',
          '   <img src="http://api.adorable.io/avatars/50/'+username+'" alt="User Avatar" class="img-circle" />',
          ' </span>',
          ' <div class="chat-body clearfix">',
          '   <div class="header">',
          '     <strong class="primary-font">'+username+'</strong>',
          '     <small class="pull-right text-muted"><i class="fa fa-upload-o fa-fw"></i> </small>',
          '   </div>',
          '   <p>'+message+'</p>',
          ' </div>',
          '</li>'
        ].join("\n")
}