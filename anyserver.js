
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8081;

//Object.freeze(Color);

global.users = {};
global.boards = {};

app.use(express.static(__dirname + '/public'));

//
// Move to utils
//
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function onConnection(socket){
  user = {uuid: 0, bid: 0, color: 0};
  board = {cards: [], cid: 0};
  //console.log("Hi" + global.cnt);

  //const user = {name: "random123"};
  //socket.on('message', (data) => socket.broadcast.emit('message', data));
  socket.on("message", (incoming) => {
    msg = JSON.parse(incoming);
    console.log(msg);

    switch(msg.type) {
      case "LOGIN":
        // Get user or create NEW
        if("uuid" in msg) {
          if(msg.uuid in global.users)
            user = global.users[msg.uuid];
          else
            user = {bid: 0, uuid: msg.uuid, dummy: 'true', color: 0};
        }
        else {
          user = {bid: 0, uuid: uuid(), dummy: 'true'};
          global.users[user.uuid] = user;
        }
        socket.emit("message", JSON.stringify({type: "LOGIN", user: user}));
        break;

      case "BOARD":
        // Join or create board
        uid = ("uuid" in msg ? msg.uuid : uuid());
        user.bid = uid;
        global.boards[uid] = {name: {}, pages: {}};
        console.log("board");
        socket.emit("message", JSON.stringify({type: "BOARD", board: global.boards[uid]}));
        break;

      case "NEWCARD":
        console.log("Got new, now responding");
        board.cid++;
        card = {id: board.cid, name: "dummy", owner: 0, x: 200, y: 200, icon: "", color: 0};
        board.cards.push(card);
        socket.emit("message", JSON.stringify({type: "NEWCARD", card: card}));
        break;
    }
  });
}
/*
io.on("new", function(data) {
    //
    console.log("NEW CARD");
    //emitsForSomeMessage.push(data);
    socket.on('message', (data) => socket.broadcast.emit('message', data));
});

app.get('/n', (req, res) => {
    res.send('Hello shitface' + global.cnt);
});

app.post('/n', (req, res) => {
    res.send('Hello shitface' + global.cnt);
});*/

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
