const socket = io();
import Topic from "./modules/Topic.js";
import Constants from "./modules/Constants.js";

let roomFocus = null;
let upChevron = `<i class="fas fa-chevron-up fa-2x" style="color: #7386d5"> </i>`;
let downChevron = `<i class="fas fa-chevron-down fa-2x" style="color: #7386d5"> </i>`;

function htmlDecode(value) {
  return $("<textarea/>").html(value).text();
}

function register() {
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('screenname')
  socket.emit(Constants.CLIENT_EVENT_REGISTER, userName, (response) => {
  });
}

function message(content, articleId, replyingToId) {
  socket.emit(
    Constants.CLIENT_EVENT_COMMENT,
    content,
    articleId,
    replyingToId,
    (response) => {
      return response.id;
    }
  );
}


function getCommentHTML(
  senderId,
  articleId,
  content,
  messageId,
  replyingToId,
  time
) {
  return `
		<div class="card mt-5">
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
function handleCommentEmission(
  senderId,
  articleId,
  content,
  messageId,
  replyingToId,
  time
) {
  let html = getCommentHTML(
    senderId,
    articleId,
    content,
    messageId,
    replyingToId,
    time
  );
  $(`#messageArea_${articleId}`).append(html);
  $(`#messageArea_${articleId}`).scrollTop(
    $(`#messageArea_${articleId}`)[0].scrollHeight
  );
}
function handleServerSideComments(topic, topicId) {
  for (const [k, value] of topic.comments.entries()) {
    handleCommentEmission(
      value["authorName"],
      topicId,
      value["content"],
      value["articleId"],
      value["replyingToId"],
      "2020"
    );
  }
}

function focusTopic(topicId) {
  socket.emit(Constants.CLIENT_EVENT_GET_TOPIC, topicId, (response) => {
    const topic = new Topic(JSON.parse(response.topic));

    const upvotedCommentIds = JSON.parse(response.upvotedCommentIds);
    const downvotedCommentIds = JSON.parse(response.downvotedCommentIds);
    const topicHTML = response.topicHTML;
    handleFocus(topicHTML, topic, upvotedCommentIds, downvotedCommentIds);
    handleServerSideComments(topic, topicId);
  });
}

function handleFocus(topicHTML, topic, upvotedCommentIds, downvotedCommentIds) {
  $("#topicInFocus").html(topicHTML);
  $("#topperButton").hide();
  $("#messageJumper").hide();
  $("#sidebarCollapse_").on("click", function () {
    $("#content").width("70vw");
    $("#sidebar").toggleClass("active");
    $("#sidebarCollapse_").css("display", "none");
  });

  $('[id^="show_"]').click(function (e) {
    if (roomFocus === $(this)[0].id) {
      $(this)[0].innerHTML = upChevron;
      $("#active_article").html("");
      roomFocus = null;
      $("#topperButton").hide();
      $("#messageJumper").hide();
      return;
    }
    $("#topperButton").show();
    $("#messageJumper").show();
    roomFocus = $(this)[0].id;
    $(this)[0].innerHTML = downChevron;
    let doc = $(this)[0].id.replace("show", "#article");
    $("#active_article").html(htmlDecode($(doc)[0].innerHTML));
  });

  $(".commentPicker").keydown((e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      let id = e.currentTarget.id.replace("comment_", "");
      let comment = e.currentTarget.value;
      message(comment, id, null);
      e.currentTarget.value = "";
    }
  });
}

$(document).ready(() => {
  register();
  socket.on(
    Constants.SERVER_EVENT_COMMENT,
    (senderId, messageId, content, articleId, replyingToId, time) => {

      handleCommentEmission(
        senderId,
        articleId,
        content,
        messageId,
        replyingToId,
        time
      );
    }
  );


  $("#sidebarCollapse").on("click", function () {
    $("#content").width("100%");
    $("#sidebar").css("margin-left", "-30vw");

    $("#sidebarCollapse_").css("display", "block");
    setTimeout(() => {
      $("#sidebarCollapse_").css("display", "block");
    }, 130);
  });
  $("#sidebarCollapse_").on("click", function () {
    $("#content").width("70vw");
    $("#sidebarCollapse_").css("display", "none");
    $("#sidebar").css("margin-left", 0);
  });

  $('[id^="show_"]').click(function (e) {
    let doc = $(this)[0].id.replace("show", "#article");
    $("#active_article").html(htmlDecode($(doc)[0].innerHTML));
  });

  $(".clickCatcher").click((e) => {
    focusTopic(e.currentTarget.id);
  });
});
