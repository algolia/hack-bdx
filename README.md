# Algolia workshop

The goal of this workshop will be to create a sample application using Algolia.
For this example, we'll use a Bordeaux related dataset: approximately 1000 wine bottles from the area.

## requirements

To follow this workshop without needing to install a lot, we suggest you use `node v4+` and an internet connection.

## Initial server configuration

To get to this point, we used the Express generator to have a good starting point. We also provide a sqlite database to get you started fast.

```sh
$ npm install -g express-generator
$ express --view=pug wine-search
$ cd wine-search
$ npm install
$ npm run dev
```

And then we also set `sqlite` up for you to use.

<details>
<summary>Setup of sqlite</summary>

### link the sqlite

add a reference to the sqlite

```js
// /bin/www
var db = require('sqlite');

// replace server.listen(port) with:
Promise.resolve()
  .then(() => db.open('../development.sqlite3', { Promise }))
  .catch(err => console.error(err.stack))
  .then(() => server.listen(port));
```

</details>
 
## Adding search

We'll now add a basic search using your database.

The first step will be to add a search input on our wine list page.

```pug
// /views/index.pug
block content
  form
    input(type="search", name="q", placeholder="search", value=query) 
  for hit in wines
    .hit
      .hit-image
        img(src=hit.image, alt=hit.name)
      .hit-content
        h3.hit-price $
          span=hit.price
        h3.hit-price= quality
        h2.hit-name= name
        p= type
        p= year
```

To search, we add a very simple database query to to show what is in our data. 

> note: this is not production code, it has a possible [SQL injection](https://en.wikipedia.org/wiki/SQL_injection)

```js
// /routes/index.js
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
```
