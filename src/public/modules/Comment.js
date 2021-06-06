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
export default Comment;