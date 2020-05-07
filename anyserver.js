
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
  //console.log(global.boards);
  if(bid in global.boards) {
    return global.boards[bid];
  }
  global.boards[bid] = {bid: bid, name: "Unnamed board", layout: "", nextCardId: 0, cards: []}
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
        user.bid = msg.board.bid;
        board = getOrCreateBoard(msg.board.bid);
        board.name = msg.board.name;
        board.layout = msg.board.layout;

        socket.emit("message", JSON.stringify({type: "BOARD", board: board}));
        socket.broadcast.to(msg.board.bid).emit("message", JSON.stringify({type: "BOARD", board: board}));
        break;

      case "NEWCARD":
        board = getOrCreateBoard(msg.bid);
        board.nextCardId++;
        card = {id: board.nextCardId, bid: msg.bid, text: "Text here...", owner: msg.owner, x: 200, y: 200, icon: msg.icon, color: msg.color, votes: {}};
        board.cards.push(card);

        socket.emit("message", JSON.stringify({type: "NEWCARD", card: card}));
        socket.broadcast.to(msg.bid).emit("message", JSON.stringify({type: "NEWCARD", card: card}));
        break;

      case "MOVE":
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
        break;

      case "CLEAN":
        board = getOrCreateBoard(msg.bid);
        board.cards = new Array();

        socket.emit("message", JSON.stringify({type: "CLEAN"}));
        socket.broadcast.to(msg.bid).emit("message", JSON.stringify({type: "CLEAN"}));
        break;
    }
  });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
