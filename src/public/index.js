const socket = io();

/**
 * Objects
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
		this.weight = sourceObject.wieght;
	}
}

class Topic {
	constructor(sourceObject) {
		this.id = sourceObject.id;
		this.sourceArticle = new Article(JSON.parse(sourceObject.source));
		this.relatedArticles = [];
		JSON.parse(sourceObject.relatedArticles).forEach((relatedArticle) =>
			this.relatedArticles.push(new Article(relatedArticle)),
		);
		this.comments = new Map();
		for (let k of Object.keys(sourceObject.comments)) {
		  this.comments.set(k, new Comment(sourceObject.comments[k]));
		}
	}
	toJSON() {
		return {
			id: this.id,
			source: JSON.stringify(this.sourceArticle),
			relatedArticles: JSON.parse(JSON.stringify(this.relatedArticles)),
			comments: JSON.stringify(Comment.mapToJson(this.comments))
		}
	}
}

class Comment {
	constructor(sourceObject) {
		this.authorName = sourceObject.authorName;
		this.content = sourceObject.content;
		this.articleId = sourceObject.articleId;
		this.replyingToId = sourceObject.replyingToId;
		if(sourceObject.responseIds) {
			this.responseIds = JSON.parse()
		} else {
			this.responseIds 
		}
		this.score = sourceObject.score;
	}

	static mapToJson(messageMap) {
		let ret = Object.create(null);
		for (const [k, v] of messageMap) {
			ret[k] = v;
		}
		return ret;
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
			wieght: this.weight
		}
	}
}

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

function register(userName) {
	socket.emit(CLIENT_EVENT_REGISTER, userName, (response) => {
		if (response.status === STATUS_ACCEPETED) {
			//TODO
		} else {
			// TODO
		}
	});
}

function handleFocus(topic,upvotedCommentIds, downvotedCommentIds){ 
	console.log(topic.toJSON())
}

function focusTopic(topicId) {
	socket.emit(CLIENT_EVENT_GET_TOPIC, topicId, (response) => {
		const topic = new Topic(JSON.parse(response.topic));
		const upvotedCommentIds = JSON.parse(response.upvotedCommentIds);
		const downvotedCommentIds = JSON.parse(response.downvotedCommentIds);
		handleFocus(topic,upvotedCommentIds, downvotedCommentIds)
	});
}

function message(content, articleId, replyingToId) {
	socket.emit(CLIENT_EVENT_COMMENT, content, articleId, replyingToId);
}

function upvote(commentId) {
	socket.emit(CLIENT_EVENT_UPVOTE, commentId);
}

function downvote(commentId) {
	socket.emit(CLIENT_EVENT_DOWNVOTE, commentId);
}
$(document).ready(() => {
	socket.on(
		SERVER_EVENT_COMMENT,
		(senderId, messageId, content, articleId, replyingToId) => {
			if (replyingToId) {
				//TODO handle if response message
			} else {
				//TODO handle original comment
			}
		},
	);

	socket.on(SERVER_EVENT_UPVOTE, (commentId) => {
		// TODO
	});

	socket.on(SERVER_EVENT_DOWNVOTE, (commentId) => {
		// TODO
	});

	function htmlDecode(value) {
		return $('<textarea/>').html(value).text();
	}

	$('#sidebarCollapse').on('click', function () {
		$('#content').width('100%')
		$('#sidebar').toggleClass('active');
		setTimeout(() => {
			$('#sidebarCollapse_').css('display', 'block');
		}, 130);
	});
	let str = `<%= include('topicCard', {article: articles[0]}); %>`;
	// $('body').html(htmlDecode(str))
	$('#sidebarCollapse_').on('click', function () {
		$('#content').width('70vw')
		$('#sidebar').toggleClass('active');
		$('#sidebarCollapse_').css('display', 'none');
	});

	$('[id^="show_"]').click(function (e) {
		// do something
		let doc = $(this)[0].id.replace('show', '#article')
		$('#active_article').html(htmlDecode($(doc)[0].innerHTML))
	});

	$('.clickCatcher').click((e)=>{
		focusTopic(e.currentTarget.id)
	})

});
