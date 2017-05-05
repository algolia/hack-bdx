var express = require('express');
var router = express.Router();
var db = require('sqlite');

/* GET home page. */
router.get('/', function(req, res, next) {
  db
    .all(
      `
      SELECT * FROM wines
      WHERE name LIKE '%${req.query.q}%'
      LIMIT 5
      `
    )
    .then(wines => res.render('index', { wines, query: req.query.q }));
});

module.exports = router;
