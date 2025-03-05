var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');

const NEWS_API_KEY = process.env.NEWS_API_KEY;

router.get('/', (req, res) => {
  fetch(`https://newsapi.org/v2/everything?apiKey=${NEWS_API_KEY}&language=en&q=vegan OR gluten OR vegetarian&searchIn=title&pageSize=20`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'ok') {
        res.json({ articles: data.articles });
      } else {
        res.json({ articles: [] });
      }
    });
});

module.exports = router;