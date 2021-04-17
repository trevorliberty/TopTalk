require('dotenv').config();
const NewsAPI = require('newsapi');

const newsapi = new NewsAPI(process.env.API_KEY);

const getTopHeadlines = async () => {
	let response = await newsapi.v2.topHeadlines({
		country: 'us',
	});

	return response['articles'];
};
const getQueryHeadlines = async (title, url) => {
	let response = await newsapi.v2.everything({
		q: title,
	});
	return response['articles'].filter((article) => {
		return article.source.name !== 'Slashdot.org' && url !== article.url;
	});
};

module.exports = {
	getTopHeadlines,
	getQueryHeadlines,
};
