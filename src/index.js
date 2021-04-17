const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const run = require('./api/api');

let objects = run();
console.log(objects);

app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
	res.redirect('index.html');
});

io.on('connection', (socket) => {
	//TODO handle user connects
	socket.on('disconnect', () => {
		//TODO handle user disconnects
	});

	socket.emit('init', middleware());
});

server.listen(process.env.PORT, () => {
	console.log(`listening on port ${process.env.PORT}`);
});
