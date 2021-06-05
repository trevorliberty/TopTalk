const Article = require('./Article')

class Topic {
  constructor(sourceObject) {
    this.id = sourceObject.id;
    this.sourceArticle = new Article(sourceObject.source);
    this.relatedArticles = [];
    sourceObject.relatedArticles.forEach((relatedArticle) =>
      this.relatedArticles.push(new Article(relatedArticle))
    );
    this.comments = new Map(); // Top level comments that are not responses
    this.allCommentMap = new Map(); // A map from every valid comment id to the associated comment object
  }

  toJSON() {
    return {
      id: this.id,
      source: JSON.stringify(this.sourceArticle),
      relatedArticles: JSON.stringify(this.relatedArticles),
      comments: JSON.stringify(Comment.mapToJson(this.comments)),
    };
  }
}
module.exports = Topic;