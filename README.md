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

## Algolia configuration

The first step is to create an account on https://www.algolia.com/ .
You can skip the tutorial as this workshop will walk you through more steps.

Once in your dashboard, the first thing you'll need are your credentials in the [API Keys](https://www.algolia.com/api-keys) tab.

But before that, we need to make a script that will take all our wine and then upload them to Algolia

### Making the migration script

```sh
$ npm install --save sqlite lodash async
$ # or you can
$ yarn add sqlite lodash async
```

First get all our data and chunk it

```js
// /scripts/migration.js
var db = require('sqlite');
var chunk = require('lodash/chunk');
const each = require('async/each');

function end(err) {
  if (err) throw err;
  console.log('✨ Done with uploading, get ready to search 🔍');
}

Promise.resolve()
  .then(() => db.open('../development.sqlite3', { Promise }))
  .catch(err => console.error(err.stack))
  .then(() => db.all('SELECT * from roles'))
  .then(roles => chunk(roles, 1000));
```

### Setting up Algolia

Add the module:

```sh
$ npm install --save algoliasearch
$ # or you can
$ yarn add algoliasearch
```

And then edit the migration script to push the data to Algolia. First we will register a client with the info we find on [algolia.com/api-keys](https://algolia.com/api-keys):

```js
// /bin/migration
const algoliasearch = require('algoliasearch');
const config = {
  appId: 'XXXXX',
  apiKey: 'XXXXX', // admin API key
  indexName: 'wine-search',
};

const client = algoliasearch(config.appId, config.apiKey);
const index = client.initIndex(config.indexName);
```

And then upload each chunk:

```js
  .then(chunks => each(chunks, index.addObjects.bind(index), end));
```

Now let's run it: 

```sh
$ node ./bin/migration
$ # or
$ npm run migrate
```

If this was a real database that isn't static like this one, there's one extra step, which is replication. Replication can be done very simply by listening to the changes in your database, and then for each of them do `index.saveObject`

## Now in the front-end!

We'll do a really basic search again, in the front-end this time, using our [`instantsearch.js` library](https://community.algolia.com/instantsearch.js/).

First step will be to add it to our page.
In `views/layouts/layout.pug`, add:

```pug
title Wine Search
meta(name="theme-color", content="#fff5e4")
link(rel='stylesheet', href='https://cdn.jsdelivr.net/instantsearch.js/1/instantsearch.min.css')
link(rel='stylesheet', href='https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css')
```

Now let's add the main logic!

First, replace the current search form, the stats and list of results in your view by containers.
In `views/index.pug`:

```pug
block content
  header
    a(href='.')
      img(src='/images/wine-search.svg')
    #search-input
    #search-input-icon
  main
    #left-column
    #right-column
      #hits
  script#hit-template(type='text/html').
    <div class="hit">
      <div class="hit-image">
        <img src="{{image}}" alt="{{name}}">
      </div>
      <div class="hit-content">
        <h3 class="hit-price">${{price}}</h3>
        <h3 class="hit-price">{{quality}}</h3>
        <h2 class="hit-name">{{{_highlightResult.name.value}}}</h2>
        <p>{{{_highlightResult.type.value}}}</p>
        <p>{{year}}</p>
        <p>{{{_highlightResult.domain.value}}}</p>
      </div>
    </div>
  script(src='https://cdn.jsdelivr.net/instantsearch.js/1/instantsearch.min.js')
  script(src='/javascripts/search.js')
```

Then add `public/javascripts/search.js`:

```js
/* global instantsearch */

app({
  appId: 'XXX',
  apiKey: 'XXX', // search API key
  indexName: 'wine-search',
});

function app(opts) {
  if (opts.appId === 'XXX') {
    console.error('You forgot to change the API key');
    return;
  }

  // ---------------------
  //
  //  Init
  //
  // ---------------------
  const search = instantsearch({
    appId: opts.appId,
    apiKey: opts.apiKey,
    indexName: opts.indexName,
    urlSync: true,
  });

  // ---------------------
  //
  //  Default widgets
  //
  // ---------------------
  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#search-input',
      placeholder: 'Search for wine 🍷',
    })
  );

  search.addWidget(
    instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 10,
      templates: {
        item: getTemplate('hit'),
      },
      transformData: {
        item: function(item) {
          // We just call this function to log the data so that
          // you can know what you can use in your item template
          console.log(item);
          return item;
        },
      },
    })
  );

  search.start();
}

// ---------------------
//
//  Helper functions
//
// ---------------------
function getTemplate(templateName) {
  return document.querySelector(`#${templateName}-template`).innerHTML;
}

function getHeader(title) {
  return `<h5>${title}</h5>`;
}
```

We will also give our store a nice logo you can find at <https://wine-search.now.sh/images/wine-search.svg> (made in a few minutes Thursday evening by our awesome designer [Sebastien Navizet](https://dribbble.com/SebastienNvzt))

Let's also remove the calls to the sqlite database:

```js
// routes/index.js
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

module.exports = router;
```

And: 

```diff
// bin/www
- Promise.resolve()
-    .then(() => db.open('development.sqlite3', { Promise }))
-    .catch(err => console.error(err.stack))
-    .then(() => server.listen(port));
+  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
```

## What now?

You have access to the documentation of instantsearch.
You can see what we did with it live [here](https://wine-search.now.sh).

To see how we built it, you can check out the last commit of this repo.
