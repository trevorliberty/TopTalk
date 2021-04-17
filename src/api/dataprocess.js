const blackList = require('./blacklist');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { getTopHeadlines, getQueryHeadlines } = require('./newsAPI');

const getWords = (theString) => {
	theString = theString.toLowerCase().trim();
	stringArr = theString.split(' ');
	return stringArr.filter((word) => !blackList[word]);
};

const setWordMapInfo = (title, WordMap) => {
	const words = getWords(title);
	words.forEach((word) => {
		WordMap.set(word, 1);
	});
};

const titleFormatter = (title) => {
	let idx = title.lastIndexOf('-');
	return title.substring(0, idx).trim();
};

const processWeights = (results, WordMap) => {
	results.forEach((result) => {
		let weight = 0;
		let title = result['title'];
		title = getWords(title);
		title.forEach((title) => {
			if (WordMap.has(title)) {
				weight += WordMap.get(title);
			}
		});
		result['weight'] = weight;
	});
	return results;
};
const processWordMap = (results, WordMap) => {
	results.forEach((result) => {
		let title = result['title'];
		// title = title.split(' ');
		title = getWords(title);
		title.forEach((word) => {
			if (WordMap.has(word)) {
				let scala = WordMap.get(word);
				WordMap.set(word, ++scala);
			}
		});
	});
};

const determineSelections = (results) => {
	if (results[0]) {
		let highestWeight = results[0].weight;
		return results.filter((result) => {
			return result.weight > 0.45 * highestWeight;
		});
	} else {
		console.log('oops');
	}
};

module.exports = async () => {
	let objects = [];
	let articles = await getTopHeadlines();
	objects = articles.map(async (article) => {
		const WordMap = new Map();
		setWordMapInfo(article.title, WordMap);
		let title = titleFormatter(article.title);
		let results = await getQueryHeadlines(title, article.url);
		processWordMap(results, WordMap);

		results = processWeights(results, WordMap);

		results.sort((a, b) => {
			if (a.weight < b.weight) return 1;
			return -1;
		});
		results = determineSelections(results);

		const obj = {
			id: uuidv4(),
			source: article,
			relatedArticles: results,
		};
		return obj;
	});
	Promise.all(objects).then((values) => {
		console.log(values);
		values = values.filter((article) => {
			return article.relatedArticles;
		});
		values = values.sort((a, b) => {
			if (a.relatedArticles.length < b.relatedArticles.length) return 1;
			return -1;
		});
		fs.writeFile('results.json', JSON.stringify(values, null, 4), (e) => {});
		return values;
	});
};
