const socket = io();

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
const SERVER_EVENT_COMMENT =  'SERVER_EVENT_COMMENT';
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

function focusTopic(topicId) {
    socket.emit(CLIENT_EVENT_PICK_TOPIC, topicId, (response) => {
        console.log(response.topicMessages) // TODO
        console.log(response.upvotedCommentIds)
        console.log(response.downvotedCommentIds)
    });
}

function message(content, articleId, replyingToId) {
    socket.emit(CLIENT_EVENT_COMMENT, content, articleId, replyingToId)
}

function upvote(commentId) {
    socket.emit(CLIENT_EVENT_UPVOTE, commentId)
}

function downvote(commentId) {
    socket.emit(CLIENT_EVENT_DOWNVOTE, commentId)
}

socket.on(SERVER_EVENT_COMMENT, (senderId, messageId, content, articleId, replyingToId) => {
    if(replyingToId) {
        //TODO handle if response message
    } else {
        //TODO handle original comment
    }
})

socket.on(SERVER_EVENT_UPVOTE, (commentId) => {
    // TODO
})

socket.on(SERVER_EVENT_DOWNVOTE, (commentId) => {
    // TODO
})