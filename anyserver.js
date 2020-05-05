
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8081;
global.cnt = 1;

app.use(express.static(__dirname + '/public'));

function onConnection(socket){
  global.cnt++;
  console.log("Hi" + global.cnt);
  socket.on('message', (data) => socket.broadcast.emit('message', data));
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
