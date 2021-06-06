require("dotenv").config();
const fetch = require("node-fetch");
const NewsAPI = require("newsapi");

const newsapi = new NewsAPI(process.env.API_KEY);
const rapidApiKey = process.env.RAPID_TOKEN;
const diffBotApiKey = process.env.DIFFBOT_TOKEN;

//API is used to get the contents of an article as html for prenestation in TopTalk
const getHTML = async (url) => {
  let response = await fetch(
    `https://diffbot-diffbot.p.rapidapi.com/v2/article?token=${diffBotApiKey}&url=${url}&timeout=15000&fields=html`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "diffbot-diffbot.p.rapidapi.com",
      },
    }
  );
  let json = await response.json();

  return json.html;
};

//Get todays top heeadlines from the api, only stores in the us
const getTopHeadlines = async () => {
  let response = await newsapi.v2.topHeadlines({
    country: "us",
  });

  return response["articles"];
};

//Function to find related articles given a title
const getQueryHeadlines = async (title, url) => {
  let response = await newsapi.v2.everything({
    q: title,
  });

  return (response = response["articles"].filter((article) => {
    return article.source.name !== "Slashdot.org" && url !== article.url;
  }));
};

//Export functions to be used elsewhere in the app
module.exports = {
  getTopHeadlines,
  getQueryHeadlines,
  getHTML,
};
