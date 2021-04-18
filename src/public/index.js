const socket = io();

let roomFocus=null
let inFocus = false;
let upChevron = `<i class="fas fa-chevron-up fa-2x" style="color: #7386d5"> </i>`
let downChevron = `<i class="fas fa-chevron-down fa-2x" style="color: #7386d5"> </i>`

function htmlDecode(value) {
	return $('<textarea/>').html(value).text();
}
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

		let parsedComments = JSON.parse(sourceObject.comments)
		for(const key of Object.keys(parsedComments)) {
			this.comments.set(key, new Comment(parsedComments[key]));
		}

		// for (let k of Object.keys(sourceObject.comments)) {
		// 	this.comments.set(k, new Comment(sourceObject.comments[k]));
		// }

	}
	toJSON() {
		return {
			id: this.id,
			source: JSON.parse(this.sourceArticle),
			relatedArticles: JSON.stringify(this.relatedArticles),
			comments: Comment.mapToJson(this.comments),
		};
	}
}

class Comment {
	constructor(sourceObject) {
		this.authorName = sourceObject.authorName;
		this.content = sourceObject.content;
		this.articleId = sourceObject.articleId;
		this.replyingToId = sourceObject.replyingToId;
		this.responses = new Map();
		if (sourceObject.responses) {
			for (let k of Object.keys(sourceObject.responses)) {
				this.responses.set(k, new Comment(sourceObject.responses[k]));
			}
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
			authorName: this.authorName,
			content: this.content,
			articleId: this.articleId,
			replyingToId: this.replyingToId,
			responses: Comment.mapToJson(this.responses),
			score: this.score,
		};
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


function handleServerSideComments(topic){
	for(const [k,comment] of topic.comments.entries()){
		console.log(comment);
	}
}

function focusTopic(topicId) {
	socket.emit(CLIENT_EVENT_GET_TOPIC, topicId, (response) => {
		const topic = new Topic(JSON.parse(response.topic));
		handleServerSideComments(topic)
		const upvotedCommentIds = JSON.parse(response.upvotedCommentIds);
		const downvotedCommentIds = JSON.parse(response.downvotedCommentIds);
		const topicHTML = response.topicHTML;
		handleFocus(topicHTML, topic, upvotedCommentIds, downvotedCommentIds);
	});
}

function message(content, articleId, replyingToId) {
	socket.emit(
		CLIENT_EVENT_COMMENT,
		content,
		articleId,
		replyingToId,
		(response) => {
			return response.id;
		}
	);
}

function upvote(commentId) {
	socket.emit(CLIENT_EVENT_UPVOTE, commentId);
}

function downvote(commentId) {
	socket.emit(CLIENT_EVENT_DOWNVOTE, commentId);
}

function getCommentHTML(senderId,messageId,content,articleId,replyingToId, time){

	return `
		<div class="card">
		<div class="card-header">${senderId}</div>
		<div class="card-body">
			<blockquote class="blockquote mb-0">
				<p>${content}</p>
				<footer class="blockquote-footer">
				${time}
				</footer>
			</blockquote>
		</div>
		</div>
	`;
}
function handleCommentEmission(senderId,messageId,content,articleId,replyingToId, time){
	let html = getCommentHTML(senderId, messageId,content,articleId,replyingToId,time)
	$(`#messageArea_${articleId}`).append(html);
}


function handleFocus(topicHTML, topic, upvotedCommentIds, downvotedCommentIds) {
	$('#topicInFocus').html(topicHTML);
	$('#sidebarCollapse_').on('click', function () {
		$('#content').width('70vw');
		$('#sidebar').toggleClass('active');
		$('#sidebarCollapse_').css('display', 'none');
	});

	$('[id^="show_"]').click(function (e) {
		console.log(e.currentTarget);
		if(roomFocus === $(this)[0].id){
			$(this)[0].innerHTML = upChevron
			$('#active_article').html('');
			roomFocus=null
			return
		}
		roomFocus=$(this)[0].id;
		$(this)[0].innerHTML = downChevron
		let doc = $(this)[0].id.replace('show', '#article');
		$('#active_article').html(htmlDecode($(doc)[0].innerHTML));
	});

	$('.commentPicker').keydown((e)=>{
		if(e.keyCode === 13){
			e.preventDefault();
			let id = e.currentTarget.id.replace('comment_', '');
			let comment = e.currentTarget.value;
			message(comment, id, null)
			e.currentTarget.value = ''
		}
	})
}
$(document).ready(() => {
	socket.on(
		SERVER_EVENT_COMMENT,
		(senderId, messageId, content, articleId, replyingToId,time) => {
			if (replyingToId) {
				//TODO handle if response message
			} else {
				//TODO handle original comment
			}
			handleCommentEmission(senderId,messageId,content,articleId,replyingToId,time)


		},
	);

	socket.on(SERVER_EVENT_UPVOTE, (commentId) => {
		// TODO
	});

	socket.on(SERVER_EVENT_DOWNVOTE, (commentId) => {
		// TODO
	});

	$('#sidebarCollapse').on('click', function () {
		$('#content').width('100%');
		// $('#sidebar').toggleClass('active');
		$('#sidebar').css('margin-left','-30vw')

			$('#sidebarCollapse_').css('display', 'block');
		setTimeout(() => {
			$('#sidebarCollapse_').css('display', 'block');
		}, 130);
	});
	$('#sidebarCollapse_').on('click', function () {
		$('#content').width('70vw');
		// $('#sidebar').toggleClass('active');
		 $('#sidebarCollapse_').css('display', 'none');
		 $('#sidebar').css('margin-left', 0)
	});

	$('[id^="show_"]').click(function (e) {
		// do something
		let doc = $(this)[0].id.replace('show', '#article');
		$('#active_article').html(htmlDecode($(doc)[0].innerHTML));
	});

	$('.clickCatcher').click((e) => {
		focusTopic(e.currentTarget.id);
	});
});
