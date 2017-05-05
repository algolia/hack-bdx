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

And then edit the migration script to push the data to Algolia. First we will register a client:

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
