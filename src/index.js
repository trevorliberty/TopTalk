const express = require('express');
const path = require('path')
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  res.redirect('index.html');
});

io.on('connection', (socket) => {
    //TODO handle user connects
    socket.on('disconnect', () => {
        //TODO handle user disconnects
    })
    
})

server.listen(3000, () => {
  console.log('listening on *:3000');
});