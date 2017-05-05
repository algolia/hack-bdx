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
