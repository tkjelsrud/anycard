
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
function createUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getOrCreateBoard(bid) {
  if(bid in global.boards) {
    return global.boards[bid];
  }
  global.boards[bid] = {bid: bid, name: "Unnamed board", layout: 0, nextCardId: 0, cards: []}
  return global.boards[bid];
}

function getCard(bid, cid) {
  board = getOrCreateBoard(bid);
  //console.log(board);
  for(i = 0; i < board.cards.length; i++) {
    //console.log(board.cards[i]);
    //console.log("= " + cid + "?");
    if(board.cards[i].id == cid)
      return board.cards[i];
  }
  return null;
}

function onConnection(socket){
  user = {unset: true};
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
        if(msg.uuid in global.users)
          user = global.users[msg.uuid];
        else {
          uuid = createUuid();
          if(!msg.bid || msg.bid == 0)
            msg.bid = uuid;
          user = {bid: msg.bid, uuid: uuid, color: Math.floor(Math.random() * 9), icon: Math.floor(Math.random() * 25)};
          global.users[uuid] = user;
        }

        board = getOrCreateBoard(user.bid);
        socket.join(user.bid);

        socket.emit("message", JSON.stringify({type: "LOGIN", user: user, board: board}));

        // Transmit all the cards to this person
        // Don't actually need - its in the login board already
        for(i = 0; i < board.cards.length; i++) {
          card = board.cards[i];
          socket.emit("message", JSON.stringify({type: "NEWCARD", card: card}));
        }

        break;

      case "BOARD":
        // TODO: think twice, avoid making too many container layers. Maybe pages is enough?
        // Join or create board
        //uid = ("uuid" in msg ? msg.uuid : createUuid());
        //user.bid = uid;
        user.bid = msg.board.id;
        board = getOrCreateBoard(msg.board.id);
        board.name = msg.board.name;
        board.layout = msg.board.layout;
        socket.emit("message", JSON.stringify({type: "BOARD", board: board}));
        break;

      case "NEWCARD":
        board = getOrCreateBoard(msg.bid);
        board.nextCardId++;
        card = {id: board.nextCardId, bid: msg.bid, text: "Text here...", owner: msg.owner, x: 200, y: 200, icon: msg.icon, color: msg.color, votes: {}};
        board.cards.push(card);
        //console.log(global.boards);
        socket.emit("message", JSON.stringify({type: "NEWCARD", card: card}));

        //TODO: Need to broadcast to board only
        socket.broadcast.to(msg.bid).emit("message", JSON.stringify({type: "NEWCARD", card: card}));
        break;

      case "MOVE":
        // Should probably check out of bounds values
        card = getCard(msg.bid, msg.id);
        if(card) {
          card.x = (msg.x >= 0 ? msg.x : 0);
          card.y = (msg.y >= 30 ? msg.y : 0);
          socket.broadcast.to(msg.bid).emit("message", JSON.stringify({type: "MOVE", card: card}));
        }
        else {
          console.warn("MOVE - Card not found, bid:" + msg.bid + " cid:" + msg.id);
        }
        break;

      case "TEXT":
        card = getCard(msg.bid, msg.id);
        if(card) {
          card.text = msg.text;
          socket.broadcast.to(msg.bid).emit("message", JSON.stringify({type: "TEXT", card: card}));
        }
        else {
          console.warn("TEXT - Card not found, bid:" + msg.bid + " cid:" + msg.id);
        }
        break;

      case "VOTE":
        card = getCard(msg.bid, msg.id);
        if(user.uuid in card.votes) {
          card.votes[user.uuid].num += msg.num;
        }
        else {
          card.votes[user.uuid] = {icon: user.icon, color: user.color, num: msg.num};
        }
        socket.emit("message", JSON.stringify({type: "VOTE", card: card}));
        socket.broadcast.to(msg.bid).emit("message", JSON.stringify({type: "VOTE", card: card}));
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
