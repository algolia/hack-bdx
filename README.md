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

