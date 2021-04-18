const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const run = require('./api/dataprocess');
const INIT = 'init';
// let objects = run();

let objects = require('./results');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
	res.render('index', { articles: objects });
});

io.on('connection', (socket) => {
	let topicInFocus = null;
	//TODO handle user connects
	socket.on('disconnect', () => {
		//TODO handle user disconnects
	});

	socket.on('roomSelect', (roomId) => {
		if (topicInFocus) {
			//unsubscribe UUID
		} else {
			socket.join(roomId);
		}
	});
	socket.emit(INIT, objects);
});

server.listen(process.env.PORT, () => {
	console.log(`listening on port ${process.env.PORT}`);
});
