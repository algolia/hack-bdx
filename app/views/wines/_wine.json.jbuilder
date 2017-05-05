json.extract! wine, :id, :name, :domain, :type, :year, :quantity, :quality, :price, :image, :created_at, :updated_at
json.url wine_url(wine, format: :json)
