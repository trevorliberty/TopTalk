/**
 * Modules
 */
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');
const uuid = require('uuid');
const run = require('./api/dataprocess');
const ejs = require('ejs');
function getTopicHTML(topic) {

	let html;
	topic = topic.toJSON();
	topic.relatedArticles=JSON.parse(topic.relatedArticles)
	topic.source=JSON.parse(topic.source)

	ejs.renderFile(
		'./views/discussion.ejs',
		{ article: topic },
		{},
		(err, str) => {
			html = str;
		},
	);

	return html;
}
/**
 * Classes
 */

class Article {
	// constructor(sourceId, sourceName, authorName, title, description, url, urlToImage, content) {
	constructor(sourceObject) {
		this.id = sourceObject.id;
		this.htmlBody = sourceObject.htmlBody;
		this.sourceId = sourceObject.source.id;
		this.sourceName = sourceObject.source.name;
		this.author = sourceObject.name;
		this.title = sourceObject.title;
		this.description = sourceObject.description;
		this.url = sourceObject.url;
		this.urlToImage = sourceObject.urlToImage;
		this.publishedAt = sourceObject.publishedAt;
		this.content = sourceObject.content;
		this.weight = sourceObject.weight;
	}

	toJSON() {
		return {
			id: this.id,
			htmlBody: this.htmlBody,
			source: JSON.stringify({
				id: this.sourceId,
				name: this.sourceName
			}),
			author: this.author,
			title: this.title,
			description: this.description,
			url: this.url,
			urlToImage: this.urlToImage,
			publishedAt: this.publishedAt,
			content: this.content,
			weight: this.weight
		}
	}
}

class Topic {
	constructor(sourceObject) {
		this.id = sourceObject.id;
		this.sourceArticle = new Article(sourceObject.source);
		this.relatedArticles = []
		sourceObject.relatedArticles.forEach(relatedArticle => this.relatedArticles.push(new Article(relatedArticle)))
		this.comments = new Map(); // Top level comments that are not responses
		this.allCommentMap = new Map(); // A map from every valid comment id to the associated comment object
	}

	toJSON() {
		return {
			id: this.id,
			source: JSON.stringify(this.sourceArticle),
			relatedArticles: JSON.stringify(this.relatedArticles),
			comments: JSON.stringify(Comment.mapToJson(this.comments))
		}
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
			responses: Comment.mapToJson(this.responses),
			score: this.score
		}
	}

}


/**
 * Variables
 */
// Exteranal vars
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
	cors: {
		origin: '*',
	}

});

// Our vars
//  let topicArticleData = run();
const topicArticleData = require('./results');
const users = new Map(); // Map[userId, userName]
const topics = new Map() // Map[topicId, Topic]
topicArticleData.forEach(topic => topics.set(String(topic.id), new Topic(topic)))

// Status constants
const STATUS_REJECTED = 'STATUS_REJECTED';
const STATUS_ACCEPETED = 'STATUS_ACCEPETED';

// Client side events
const CLIENT_EVENT_REGISTER = 'CLIENT_EVENT_REGISTER';
const CLIENT_EVENT_GET_TOPIC = 'CLIENT_EVENT_GET_TOPIC';
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
	res.render('index', { articles: topicArticleData});
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
	socket.on(CLIENT_EVENT_GET_TOPIC, (topicId, callback) => {
		if (topicInFocusId) {
			socket.leave(topicInFocusId);
		}
		topicInFocusId = topicId
		socket.join(topicInFocusId);
		callback({
			topicHTML: getTopicHTML(topics.get(topicId)),
			topic: JSON.stringify(topics.get(topicId)),
			upvotedCommentIds: JSON.stringify(Array.from(this.upvotedCommentIds)),
			downvotedCommentIds: JSON.stringify(Array.from(this.downvotedCommentIds))
		})
	});

	// User makes a comment
	socket.on(CLIENT_EVENT_COMMENT, (content, articleId, replyingToId, callback) => {
		const newCommentId = uuid.v4();
		const commentToAdd = new Comment(userName, content, articleId, replyingToId)
		topics.get(topicInFocusId).comments.set(newCommentId, commentToAdd)

		io.to(topicInFocusId).emit(SERVER_EVENT_COMMENT, socket.id, newCommentId, content, articleId, replyingToId);
		callback({
			id : newCommentId 
		})
	});

	// User upvotes a comment
	// Assumes client enforces user not bieng able to upvote their own comment
	socket.on(CLIENT_EVENT_UPVOTE, (commentId) => {
		const topicInFocus = topics.get(topicInFocusId)
		if (!topicInFocus.upvotedCommentIds.has(commentId)) {
			topicInFocus.downvotedCommentIds.delete(commentId);
			topicInFocus.upvotedCommentIds.add(commentId)
			topicInFocus.socket.to(topicInFocusId).emit(SERVER_EVENT_UPVOTE, commentId);
		}
	});

	// User upvotes a comment
	// Assumes client enforces user not bieng able to upvote their own comment
	socket.on(CLIENT_EVENT_DOWNVOTE, (commentId) => {
		const topicInFocus = topics.get(topicInFocusId)
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
