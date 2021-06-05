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
      score: this.score,
    };
  }
}

module.exports = Comment;