# Algolia workshop

The goal of this workshop will be to create a sample application using Algolia.
For this example, we'll use a Bordeaux related dataset : approximately 1000 wine bottles from the area.

You can find the list of wines in the [`db/` folder](db/) along with a seed script.
You can download both files right now.

The `Wine` model will contain those attributes:

- `name`: string
- `domain`: string
- `type`: string
- `year`: integer
- `quantity`: integer (in milliliters)
- `quality`: integer (grade out of 100)
- `price`: integer
- `image`: string (base 64 encoding of the image)

The first step will be setting up the server itself.

## Requirements

`ruby >= v2.2.2` is needed for `rails 5`.
If you don't have it, [install `rvm`](https://rvm.io/) and run `rvm install 2.4.1`.

## Initial server configuration

```sh
gem install rails -v 5
rails new algolia-workshop
cd algolia-workshop
rails g scaffold Wine name:string domain:string type:string year:integer quantity:integer quality:integer price:integer image:string
bundle exec rake db:migrate
```

Your model and its associated table are now created.

In another terminal, run `rails s`, which will launch the rails server on port 3000.
To see it in action, open `http://localhost:3000/wines` in your browser.

## Small hack to use the `type` column

Because we're using a `type` column and Rails expect to use such a column for inheritance, we'll need to tell Rails we don't want to do inheritance.
For this, just add at the beginning of your `Wine` model:

```ruby
  self.inheritance_column = nil
```

## Importing data

We'll now add some wines to our wine table.

First put the two files you've downloaded earlier ([`db/seeds.rb`](db/seeds.rb) and [`db/wines.json`](db/wines.json)) in your `db/` folder.  
Then run the seeding rake task:

```sh
bundle exec rake db:seed
```

Refresh your browser window, you should now have a list of wines.

## Better experience

For a better visual, we'll want to hide the `image` attribute from the list.

In `app/views/wines/index.html.erb`, remove those two lines:

```html
<th>Image</th>
<!-- and -->
<td><%= wine.image %></td>
```

Refresh, and everything should look nice!

## Adding search

We'll now add a basic search using your database.

The first step will be to add a search input on our wine list page.  
In `app/views/wines/index.html.erb`:

```html
<form action="/wines/search">
    <input type="text" name="query" placeholder="Search for wines..."/>
</form>
```

Now let's add this `/wines/search` page.  
In `config/routes.rb`, create a route to `/wines/search`:

```ruby
resources :wines do
  collection do
    get :search
  end
end
```

In the `Wines` controller, add a `search` method.  
In `app/controllers/wines_controller.rb`:

```ruby
def search
  query = '%' + params[:query] + '%'
  @results = Wine
             .where('name LIKE ? OR domain LIKE ?', query, query)
             .order('quality DESC')
             .limit(10)
end
```

Create a `search` view to list those results.  
In `app/views/wines/search.html.erb`:

```html
<a href="/wines/">&larr; Back to list</a>

<h1>Search</h1>

<form action="/wines/search">
  <input name="query" type="text" placeholder="Search for wines..." />
</form>

<h5><%= @results.size %> results found</h5>

<ul>
  <% @results.each do |w| %>
    <li><%= w.name %>, <%= w.domain %> - <%= w.year %></li>
  <% end %>
</ul>
```

## Algolia configuration

The first step is to create an account on https://www.algolia.com/ .  
You can skip the tutorial as this workshop will walk you through more steps.

Once in your dashboard, the first thing you'll need are your credentials in the [API Keys](https://www.algolia.com/api-keys) tab.

In your `Gemfile`, add our `rails` gem.

```ruby
gem 'algoliasearch-rails', '~> 1.19.0'
```

Its documentation can be found here: https://github.com/algolia/algoliasearch-rails .

Then run in a terminal:

```sh
bundle install
```

In `config/initializers/algoliasearch.rb`:

```ruby
AlgoliaSearch.configuration = {
  application_id: 'XXX',
  api_key: 'XXX' # Admin API key (for write permissions)
}
```

Since we're adding an initializer here, you'll need to restart your `rails s`.

In `app/models/wine.rb`:

```ruby
include AlgoliaSearch
algoliasearch do
  # All the attributes to send to algolia (in this case, everything)
  attributes :name, :domain, :type, :year, :quantity, :quality, :price, :image
  # All the attributes we want to search in
  # unordered means that te position of the word(s) which matched doesn't matter
  searchableAttributes ['unordered(name)', 'domain', 'year', 'type']
  # Attribute(s) to use when sorting with the same textual match
  customRanking ['desc(quality)']
end
```

### Verification

Let's check that everything works!

In your `rails console`:

```ruby
Wine.reindex!
```

In your console again, try:

```ruby
pp Wine.search('Margaux')
```

## Use Algolia for your back-end search

In your Wines controller, you can now replace the back-end search with Algolia.
Just use `Wine.search` as you just did in your console.

In `app/controllers/wines_controller.rb`:

```ruby
def search
  @results = Wine.search(params[:query], { hitsPerPage: 10 })
end
```

## Now in the front-end!

We'll do a really basic search again, in the front-end this time, using our [`instantsearch.js` library](https://community.algolia.com/instantsearch.js/).

First step will be to add it to our page.
In `app/views/layouts/application.html.erb`, add:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/instantsearch.js/1/instantsearch.min.css" />
<script src="https://cdn.jsdelivr.net/instantsearch.js/1/instantsearch.min.js"></script>
```

Now let's add the main logic!

First, replace the current search form, the stats and list of results in your view by containers.
In `app/views/wines/search.html.erb`:

```html
<div id="search-input"></div>
<ul id="results"></ul>
```

Then in `app/assets/javascripts/algolia.js`:

```js
$(document).ready(function() {
  var search = instantsearch({
    appId: 'XXX',
    apiKey: 'XXX',
    indexName: 'Wine',
    urlSync: true
  });

  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#search-input',
      placeholder: 'Search for wines...'
    })
  );

  search.addWidget(
    instantsearch.widgets.hits({
      container: '#results',
      templates: {
        item: function (hit) {
          return '' +
            '<li>' +
            '  ' + hit._highlightResult.name.value + ',' +
            '  ' + hit._highlightResult.domain.value + ' - ' +
            '  ' + hit.year +
            '</li>';
        }
      },
      transformData: {
        item: function (hit) {
          // We just call this function to log the data so that
          // you can know what you can use in your item template
          console.log(hit);
          return hit;
        }
      }
    })
  );

  search.start();
});
```

Let's also remove the now useless call to Algolia in the back-end.  
In `app/controllers/wines_controller.rb`, just remove the line with `@results`.

## Let's improve it

First, let's add a facet (== filter) to our settings in the `algoliasearch` block in our model:

```ruby
attributesForFaceting ['searchable(domain)']
```

Then let's reindex everything to propagate those new settings:

```ruby
Wine.reindex!
```

And now let's use this new facet in our front-end.

*HTML*
```html
<main>
  <div id="left-column">
    <div id="domain"></div>
  </div>
  <div id="right-column">
    <div id="search-input"></div>
    <div id="stats"></div>
    <div id="results"></div>
  </div>
</main>
```

*CSS*
```css
main {
  width: 1000px;
  margin: 0 auto;
}

#left-column {
  float: left;
  width: 23%;
}

#right-column {
  width: 74%;
  margin-left: 26%;
}

#search-input input {
  width: 100%;
}
```

*JS*
```js
$(document).ready(function() {
  var search = instantsearch({
    appId: 'XXX',
    apiKey: 'XXX',
    indexName: 'Wine',
    urlSync: true
  });

  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#search-input',
      placeholder: 'Search for wines...'
    })
  );

  search.addWidget(
    instantsearch.widgets.stats({
      container: '#stats'
    })
  );

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#domain',
      attributeName: 'domain',
      searchForFacetValues: {
        placeholder: 'Search for domains'
      },
      templates: {
        header: '<h3>Domain</h3>',
      }
    })
  );

  search.addWidget(
    instantsearch.widgets.hits({
      container: '#results',
      templates: {
        item: function (hit) {
          return '' +
            '<li>' +
            '  ' + hit._highlightResult.name.value + ',' +
            '  ' + hit._highlightResult.domain.value + ' - ' +
            '  ' + hit.year +
            '</li>';
        }
      },
      transformData: {
        item: function (hit) {
          // We just call this function to log the data so that
          // you can know what you can use in your item template
          console.log(hit);
          return hit;
        }
      }
    })
  );

  search.start();
});
```

## What now?

You have access to the documentation of instantsearch.
You can see what we did with it live [here](https://wine-search.now.sh).

To see how we built it, you can check out the last commit of this repo.
