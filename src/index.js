/**
 * Modules
 */
const express = require("express");
const path = require("path");
const socketio = require("socket.io");
const http = require("http");
const uuid = require("uuid");
// const run = require("./api/dataprocess");
const ejs = require("ejs");
const date = require("date-and-time");
const Topic = require('./lib/Topic')
const Comment = require('./lib/Comment')
const constants = require('./lib/constants')

function getTopicHTML(topic) {
  let html;
  topic = topic.toJSON();
  topic.relatedArticles = JSON.parse(topic.relatedArticles);
  topic.source = JSON.parse(topic.source);

  ejs.renderFile(
    "./views/discussion.ejs",
    { article: topic },
    {},
    (err, str) => {
      html = str;
    }
  );

  return html;
}
/**
 * Classes
 */




/**
 * Variables
 */
// Exteranal vars
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

// Our vars
//  let topicArticleData = run();
const topicArticleData = require("./results");
const users = new Map(); // Map[userId, userName]
const topics = new Map(); // Map[topicId, Topic]
topicArticleData.forEach((topic) =>
  topics.set(String(topic.id), new Topic(topic))
);

/**
 * Configurations
 */
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));

/**
 * Routes
 */
app.get("/", (req, res) => {
  res.render("landing", { articles: topicArticleData });
});

app.get("/main", (req,res)=>{
  res.render("index", { articles: topicArticleData });
})
/**
 * Socket
 */
io.on("connection", (socket) => {
  // User-sepecific variables
  let topicInFocusId = null;
  let userName = "";
  this.upvotedCommentIds = new Set();
  this.downvotedCommentIds = new Set();

  socket.on("disconnect", () => {
    if (users.has(socket.id)) {
      users.delete(socket.id);
    }
  });

  // User registers with a username
  socket.on(constants.CLIENT_EVENT_REGISTER, (requestedName, callback) => {
    let callbackStatus = "";

    if (Array.from(users.values()).includes(requestedName)) {
      callbackStatus = constants.STATUS_REJECTED;
    } else {
      this.userName = requestedName;
      users.set(socket.id, requestedName);
      callbackStatus = constants.STATUS_ACCEPETED;
    }

    callback({
      status: callbackStatus,
    });
  });

  // User puts topic in focus
  socket.on(constants.CLIENT_EVENT_GET_TOPIC, (topicId, callback) => {
    if (topicInFocusId) {
      socket.leave(topicInFocusId);
    }
    topicInFocusId = topicId;
    socket.join(topicInFocusId);
    callback({
      topicHTML: getTopicHTML(topics.get(topicId)),
      topic: JSON.stringify(topics.get(topicId)),
      upvotedCommentIds: JSON.stringify(Array.from(this.upvotedCommentIds)),
      downvotedCommentIds: JSON.stringify(Array.from(this.downvotedCommentIds)),
    });
  });

  // User makes a comment
  socket.on(
    constants.CLIENT_EVENT_COMMENT,
    (content, articleId, replyingToId, callback) => {
      const newCommentId = uuid.v4();
      const commentToAdd = new Comment(
        this.userName,
        content,
        articleId,
        replyingToId
      );
      topics.get(topicInFocusId).comments.set(newCommentId, commentToAdd);

      const now = new Date();
      const time = date.format(now, "h:mm:ss A");
      io.to(topicInFocusId).emit(
        constants.SERVER_EVENT_COMMENT,
        users.get(socket.id),
        newCommentId,
        content,
        topicInFocusId,
        replyingToId,
        time
      );
      callback({
        id: newCommentId,
      });
    }
  );

  // User upvotes a comment
  // Assumes client enforces user not bieng able to upvote their own comment

  socket.on(constants.CLIENT_EVENT_UPVOTE, (commentId) => {
    const topicInFocus = topics.get(topicInFocusId);
    if (!topicInFocus.upvotedCommentIds.has(commentId)) {
      topicInFocus.downvotedCommentIds.delete(commentId);
      topicInFocus.upvotedCommentIds.add(commentId);
      topicInFocus.socket
        .to(topicInFocusId)
        .emit(constants.SERVER_EVENT_UPVOTE, commentId);
    }
  });

  // User upvotes a comment
  // Assumes client enforces user not bieng able to upvote their own comment
  socket.on(constants.CLIENT_EVENT_DOWNVOTE, (commentId) => {
    const topicInFocus = topics.get(topicInFocusId);
    if (!topicInFocus.downvotedCommentIds.has(commentId)) {
      topicInFocus.upvotedCommentIds.delete(commentId);
      topicInFocus.downvotedCommentIds.add(commentId);
      topicInFocus.socket
        .to(topicInFocusId)
        .emit(constants.SERVER_EVENT_DOWNVOTE, commentId);
    }
  });
});

/**
 * Server
 */
server.listen(3333, () => {
  console.log(`listening on port`);
});
