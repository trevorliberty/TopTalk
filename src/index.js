/**
 * Modules
 */
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');
const uuid = require('uuid');
const run = require('./api/dataprocess');

/**
 * Classes
 */
class TopicComments {
	constructor() {
		this.comments = new Map();
	}
}

class Comment {
	constructor(authorName, content, articleId, replyingToId) {
		this.authorName = authorName;
		this.content = content;
		this.articleId = articleId;
		this.replyingToId = replyingToId;
		this.responses = new Map();
		this.score = 0;
	}

	/**
	 * 
	 * @param {Map[string, Comment]} messageMap 
	 * @returns This map as json encoded string
	 */
	static mapToJson(messageMap) {
		let ret = Object.create(null);
		console.log(ret)
		for (const [k, v] of messageMap) {
			ret[k] = v;
		}
		return ret;
	}

	toJSON() {
		return {
			authorName: this.authorName,
			content: this.content,
			articleId: this.articleId,
			replyingToId: this.replyingToId,
			score: this.score,
			responses: Comment.mapToJson(this.responses)
		}
	}

}


/**
 * Variables
 */
// Exteranal vars
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Our vars
// let topicArticleData = run();
const topicArticleData = require('./results');
const users = new Map(); // Map[userId, userName]
const topicIdToTopic = new Map() // Map[topicId, Map[messageId, Comment]]
topicArticleData.forEach(topic => topicIdToTopic.set(topic.id, new TopicComments()))

// Status constants
const STATUS_REJECTED = 'STATUS_REJECTED';
const STATUS_ACCEPETED = 'STATUS_ACCEPETED';

// Client side events
const CLIENT_EVENT_REGISTER = 'CLIENT_EVENT_REGISTER';
const CLIENT_EVENT_PICK_TOPIC = 'CLIENT_EVENT_PICK_TOPIC';
const CLIENT_EVENT_COMMENT = 'CLIENT_EVENT_COMMENT';
const CLIENT_EVENT_UPVOTE = 'CLIENT_EVENT_UPVOTE';
const CLIENT_EVENT_DOWNVOTE = 'CLIENT_EVENT_DOWNVOTE';

// Server side evetns
const SERVER_EVENT_COMMENT = 'SERVER_EVENT_COMMENT';
const SERVER_EVENT_UPVOTE = 'SERVER_EVENT_UPVOTE';
const SERVER_EVENT_DOWNVOTE = 'SERVER_EVENT_DOWNVOTE';


/**
 * Configurations
 */
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));


/**
 * Routes
 */
app.get('/', (req, res) => {
	res.render('index');
});


/**
 * Socket
 */
io.on('connection', (socket) => {

	// User-sepecific variables
	let topicInFocusId = null;
	let userName = "";
	this.upvotedCommentIds = new Set();
	this.downvotedCommentIds = new Set();


	socket.on('disconnect', () => {
		if (users.has(socket.id)) {
			users.delete(socket.id);
		}
	});

	// User registers with a username
	socket.on(CLIENT_EVENT_REGISTER, (requestedName, callback) => {
		let callbackStatus = '';

		if (Array.from(users.values()).includes(requestedName)) {
			callbackStatus = STATUS_REJECTED;
		} else {
			this.userName = requestedName
			users.set(socket.id, requestedName);
			callbackStatus = STATUS_ACCEPETED;
		}

		callback({
			status: callbackStatus,
		});
	});

	// User puts topic in focus
	socket.on(CLIENT_EVENT_PICK_TOPIC, (topicId, callback) => {
		if (topicInFocusId) {
			socket.leave(topicInFocusId);
		}
		topicInFocusId = topicId
		socket.join(topicInFocusId);

		callback({
			topicComments: Comment.mapToJson(topicIdToTopic.get(topicInFocusId).comments),
			upvotedCommentIds: this.upvotedCommentIds,
			downvotedCommentIds: this.downvotedCommentIds
		})
	});

	// User makes a comment
	socket.on(CLIENT_EVENT_COMMENT, (content, articleId, replyingToId) => {
		let newCommentId = uuid.v4();
		topicInFocusComments = topicIdToTopic.get(topicInFocusId).comments

		if (replyingToId == null) {
			topicInFocusComments.set(newCommentId, new Comment(userName, content, articleId, replyingToId))
		} else {
			topicInFocusComments.get(replyingToId).responses.set(newCommentId, new Comment(userName, content, articleId, replyingToId))
		}
		socket.to(topicInFocusId).emit(SERVER_EVENT_COMMENT, senderId, newCommentId, userName, content, articleId, replyingToId);
	});

	// User upvotes a comment
	// Assumes client enforces user not bieng able to upvote their own comment
	socket.on(CLIENT_EVENT_UPVOTE, (commentId) => {
		const topicInFocus = topicIdToTopic.get(topicInFocusId)
		if (!topicInFocus.upvotedCommentIds.has(commentId)) {
			topicInFocus.downvotedCommentIds.delete(commentId);
			topicInFocus.upvotedCommentIds.add(commentId)
			topicInFocus.socket.to(topicInFocusId).emit(SERVER_EVENT_UPVOTE, commentId);
		}
	});

	// User upvotes a comment
	// Assumes client enforces user not bieng able to upvote their own comment
	socket.on(CLIENT_EVENT_DOWNVOTE, (commentId) => {
		const topicInFocus = topicIdToTopic.get(topicInFocusId)
		if (!topicInFocus.downvotedCommentIds.has(commentId)) {
			topicInFocus.upvotedCommentIds.delete(commentId);
			topicInFocus.downvotedCommentIds.add(commentId)
			topicInFocus.socket.to(topicInFocusId).emit(SERVER_EVENT_DOWNVOTE, commentId);
		}
	});
});

/**
 * Server
 */
server.listen(process.env.PORT, () => {
	console.log(`listening on port ${process.env.PORT}`);
});
