var user = { }

$(document).ready(function() {
  user = JSON.parse(Cookies.get('chalk_user') || '{"token":""}')
  if(user.token){
    socketAuth()
  }
})

function selfMessageHeader(username){

  return [
      '<li class="right clearfix">',
      ' <span class="chat-img pull-right">',
      '   <img src="http://api.adorable.io/avatars/50/'+username+'" alt="User Avatar" class="img-circle" />',
      ' </span>',
      ' <div class="chat-body clearfix">',
      '   <div class="header">',
      '     <small class=" text-muted"><i class="fa fa-upload-o fa-fw"></i> </small>',
      '     <strong class="pull-right primary-font">'+username+'</strong>',
      '   </div>'
    ]
}

function otherMessageHeader(username){
  return [
      '<li class="left clearfix">',
      ' <span class="chat-img pull-left">',
      '   <img src="http://api.adorable.io/avatars/50/'+username+'" alt="User Avatar" class="img-circle" />',
      ' </span>',
      ' <div class="chat-body clearfix">',
      '   <div class="header">',
      '     <strong class="primary-font">'+username+'</strong>',
      '     <small class="pull-right text-muted"><i class="fa fa-upload-o fa-fw"></i> </small>',
      '   </div>'
  ]
}

var footer = [
      ' </div>',
      '</li>'
]

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
  socket = io.connect(document.URL, {
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
      addGliphy(user.username, message, true)
      $( "#btn-input" ).attr("placeholder", "Type your message here...").val("").focus().blur()
      $('#chatHistoryContainer').scrollTop($('#chatHistoryContainer')[0].scrollHeight)
      console.log('emit', channel, message)
      socket.emit(channel, message)
      return false
    }

    socket.on('info', function(info){
      console.log(info)
    })

    socket.on('chat', function(chat){
      chat.channel = chat.channel.indexOf(':') > 0 ? chat.channel.split(':')[1] : chat.channel
      if (chat.channel === channel) {
        $("#chatHistory").append(getOtherMessage(chat.from, chat.message))
        addGliphy(chat.from, chat.message, false)
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
          addGliphy(username, message, true)
        } else {
          $("#chatHistory").append(getOtherMessage(username, message))
          addGliphy(username, message, false)
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
        channel = $(this).text().trim()
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
    channel = $('#newConversationName').val().split(':')[0]
    socket.emit('channel', channel)
  })



}

function getChannel(channel){
  if(channel.split(':')[1]){
    return [
    '<a id="channel-'+channel.split(':')[0]+'" href="#" class="list-group-item">',
    '  <i class="fa fa-comment fa-fw"></i> '+channel.split(':')[0],
    '</a>'
    ].join("\n")
  } else {
    return [
    '<a id="channel-'+channel+'" href="#" class="list-group-item">',
    '  <i class="fa fa-comments fa-fw"></i> '+channel,
    '</a>'
    ].join("\n")
  }
}

function addGliphy(username, message, self){
  if(message.match(/^\/gliphy/g)){
    request('http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag='+message.replace(/^\/gliphy/g, '').trim(),function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var result = JSON.parse(body)
        var element = []
        console.log('self', self)
        if(self){
          element = selfMessageHeader(username)
        } else {
          element = otherMessageHeader(username)
        }
        var url = result.data.image_url
        $("#chatHistory").append(element.concat(['   <img src="'+url+'" style="margin-top: 35px;">']).concat(footer).join("\n"))
      }
    })
  }
}

function getSelfMessage(username, message){
  return selfMessageHeader(username).concat(['   <p class="pull-right">'+message+'</p>']).concat(footer).join("\n")
}

function getOtherMessage(username, message){
  return otherMessageHeader(username).concat(['   <p>'+message+'</p>']).concat(footer).join("\n")
}