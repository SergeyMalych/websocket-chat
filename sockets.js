/*
* sockets.js
*/

//https://w3c.github.io/websockets/
//https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
var ws = new WebSocket("ws://127.0.0.1:8000");

// Constants & Variables
var userid = "sergeymalych" // username

// Send text to all users through the server
function sendText() {
    if (document.getElementById("message").value !== ""){
      // Construct a msg object containing the data the server needs to process the message from the chat client.
      var msg = {
          type:     "message",
          text:     document.getElementById("message").value,
          username: userid,
          date:     Date.now()
      };

      // Send the msg object as a JSON-formatted string.
      ws.send(JSON.stringify(msg));
    }
}

function createMyMessageTemplate(text, time, username, gravatar) {
  return '<li class="right clearfix"><span class="chat-img pull-right"><img src="' + gravatar + '" alt="User Grvatar" class="img-circle" /></span><div class="chat-body clearfix"><div class="header"><small class="pull-left text-muted"><span class="glyphicon glyphicon-time"></span>' + jQuery.timeago(time) + '</small><strong class="pull-right primary-font">' + username + '</strong></div><p class="msgtext">' + text + '</p></div></li>';
}

function createOtherMessageTemplate(text, time, username, gravatar) {
  return '<li class="left clearfix"><span class="chat-img pull-left"><img src="' + gravatar + '" alt="User Grvatar" class="img-circle" /></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font pull-left">' + username + '</strong> <small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span>' + jQuery.timeago(time) + '</small></div><p>' + text + '</p></div></li>';
}

function receiveLastMessages() {
    var msg = {
        type:   "lastmessages"
    };

    // Send the msg object as a JSON-formatted string.
    ws.send(JSON.stringify(msg));
}

// On websocket event receive
ws.onmessage = function(event) {

  // parse message
  var msg = JSON.parse(event.data);
  var outtext = "";
  // define type of message
  switch(msg.type) {
    // in case single message received
    case "message":
      var text = msg.text;
      var time = new Date(msg.date);
      var username = msg.username;
      var gravatar = msg.gravatar;

      // generate html output
      if (username == userid) {
        /*outtext = '<div class="me"><div class="imgright"><img src="' + gravatar + '"></div><div class="timeago">' + jQuery.timeago(time); + '</div><div class="username">' + msg.username + "</div>" + msg.text + "</div></div><div class='clear'>";
        */
        // case it was my message, according to username
        outtext = createMyMessageTemplate(text, time, username, gravatar);
      } else {  
        /*outtext = '<div class="other"><img src="' + gravatar + '" />(' + jQuery.timeago(time); + ") <b>" + msg.username + "</b>: " + msg.text + "<br></div>";
        */

        // case it was other message
        outtext = createOtherMessageTemplate(text, time, username, gravatar);
      }
      break;


    // in case many messages received
    case "messages":
      for (var i = 0, len = msg.messages.length; i < len; i++) {
        var text = msg.messages[i].text;
        var time = msg.messages[i].date;
        var username = msg.messages[i].username;
        var gravatar = msg.messages[i].gravatar;
        if (username == userid) {
          // case it was my message, according to username
          outtext += createMyMessageTemplate(text, time, username, gravatar);
        } else {  
          // case it was other message
          outtext += createOtherMessageTemplate(text, time, username, gravatar);
        }
      }
      break;

    case "system":
      var text = msg.text;
      var time = new Date(msg.date);

      // generate html output
      outtext = '<div class="system">' + msg.text + "</div>";
      break;
  }

  // write output to screen
  if (outtext.length) {
    var out = $('#output');
    out.prepend(outtext);
  }
};



$(document).ready(function() {

  userid = prompt("please enter username:", userid) || "anon";
    
  ws.onopen = function() {
    receiveLastMessages();
  }
  

});