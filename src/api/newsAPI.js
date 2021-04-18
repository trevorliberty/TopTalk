require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const NewsAPI = require('newsapi');

const newsapi = new NewsAPI(process.env.API_KEY);
const diffbotkey = process.env.DIFFBOT_TOKEN;

const rapidapikey = '3d9acc06dbmshfc5ce11c24971b0p116d65jsn008041f167b2';

const getHTML = async (url) => {
	let response = await fetch(
		`https://diffbot-diffbot.p.rapidapi.com/v2/article?token=9216af864a99daaa340cf5bba2ddfc5c&url=${url}&timeout=15000&fields=html`,
		{
			method: 'GET',
			headers: {
				'x-rapidapi-key': '3d9acc06dbmshfc5ce11c24971b0p116d65jsn008041f167b2',
				'x-rapidapi-host': 'diffbot-diffbot.p.rapidapi.com',
			},
		},
	)
	let json = await response.json()

	return json.html
};
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

	return (response = response['articles'].filter((article) => {
		return article.source.name !== 'Slashdot.org' && url !== article.url;
	}));

	//  return response.map((article) => {
	//  	let html = getHTML(article.url);
	// 	 console.log(html);
	//  	article['htmlBody'] = html
	//  	return article
	//  });
};

module.exports = {
	getTopHeadlines,
	getQueryHeadlines,
	getHTML
};
