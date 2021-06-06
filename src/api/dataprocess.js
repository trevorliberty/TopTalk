const blackList = require("./blacklist");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const { getTopHeadlines, getQueryHeadlines, getHTML } = require("./newsAPI");

//Function to filter through the words of an article title and
//remove non meanigful words so they are not considered when trying
//to find related articles
const getWords = (theString) => {
  theString = theString.toLowerCase().trim();
  stringArr = theString.split(" ");
  return stringArr.filter((word) => !blackList[word]);
};

//Set all of the original titles words in a map to be referenced
//for weight processing
const setWordMapInfo = (title, WordMap) => {
  const words = getWords(title);
  words.forEach((word) => {
    WordMap.set(word, 1);
  });
};

//News api always prepends titles with "Source - "
//We want to remove this from all titles
const titleFormatter = (title) => {
  let idx = title.lastIndexOf("-");
  return title.substring(0, idx).trim();
};

//Here we can augment the results with a weight value based
//on the contents of the WordMap
const processWeights = (results, WordMap) => {
  results.forEach((result) => {
    let weight = 0;
    let title = result["title"];
    title = getWords(title);
    title.forEach((title) => {
      if (WordMap.has(title)) {
        weight += WordMap.get(title);
      }
    });
    //New object value named 'weight' created here
    result["weight"] = weight;
  });
  return results;
};

//Function is called on every articles that is queried with the source title
//as the query parameter. A lot of these are not actually related so we go through
//the title and process word occurences against the original and set the WordMap accordingly
const processWordMap = (results, WordMap) => {
  results.forEach((result) => {
    let title = result["title"];
    title = getWords(title);
    title.forEach((word) => {
      if (WordMap.has(word)) {
        let wordWeightValue = WordMap.get(word);
        WordMap.set(word, ++wordWeightValue);
      }
    });
  });
};

//The article at results[0] is the source article and by default sets the weight standard
//The results are filtered over and if they meet a threshold of relevance, tuend through trial and error,
//they are included as a related article
const determineSelections = (results) => {
  if (results[0]) {
    let highestWeight = results[0].weight;
    return results.filter((result) => {
      return result.weight > 0.45 * highestWeight;
    });
  } else {
    console.log("No results were found.");
  }
};

//Async funciton that orchestrates the daily retrieval of articles and
//processes the results in a way that the UI knows how to interpret
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

    article["id"] = uuidv4();
    if (results) {
      results.unshift(article);
    }

    if (results) {
      results = await postProcess(results);
      //When all the promises have resolved construct the object and return
      return Promise.all(results).then((results) => {
        const mainArticleObject = {
          id: uuidv4(),
          source: article,
          relatedArticles: results,
        };
        return mainArticleObject;
      });
    }
  });
  Promise.all(objects).then((values) => {
    values = values.filter((article) => {
      return article && article.relatedArticles;
    });
    values = values.sort((a, b) => {
      if (a.relatedArticles.length < b.relatedArticles.length) return 1;
      return -1;
    });
    values.forEach((article) => {
      article.relatedArticles.map((relatedArticle) => {
        //Each article is given a unique ID as the UI will use this value for event listeners and duplicates will break
        //all website functionality
        relatedArticle["id"] = uuidv4();
        return relatedArticle;
      });
    });

    //Minimize api calls for developing by caching results in a file
    fs.writeFile("results.json", JSON.stringify(values, null, 4), (e) => {});
    return values;
  });
};

//Function remove huge video elements from article html
const postProcess = async (relatedArticles) => {
  return relatedArticles.map(async (relatedArticle) => {
    let html = await getHTML(relatedArticle.url);
    html.replace(/<\/?video[\s>]/gi, "");
    relatedArticle["htmlBody"] = html;
    return relatedArticle;
  });
};
