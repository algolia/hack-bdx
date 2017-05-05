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
