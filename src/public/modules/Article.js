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
export default Article;