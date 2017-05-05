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
