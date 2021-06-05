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
        name: this.sourceName,
      }),
      author: this.author,
      title: this.title,
      description: this.description,
      url: this.url,
      urlToImage: this.urlToImage,
      publishedAt: this.publishedAt,
      content: this.content,
      weight: this.weight,
    };
  }
}

module.exports = Article;