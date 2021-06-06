import Article from "./Article.js"
import Comment from "./Comment.js"
class Topic {
  constructor(sourceObject) {
    this.id = sourceObject.id;
    this.sourceArticle = new Article(JSON.parse(sourceObject.source));
    this.relatedArticles = [];

    JSON.parse(sourceObject.relatedArticles).forEach((relatedArticle) =>
      this.relatedArticles.push(new Article(relatedArticle))
    );

    this.comments = new Map();

    let parsedComments = JSON.parse(sourceObject.comments);
    for (const key of Object.keys(parsedComments)) {
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

export default Topic