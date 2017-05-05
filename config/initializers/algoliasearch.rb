application_id = 'XXX'
admin_api_key = 'XXX'

if application_id == 'XXX' || admin_api_key == 'XXX'
  raise 'Wrong Algolia credentials - set them up in config/initializers/algoliasearch.rb'
end

AlgoliaSearch.configuration = {
  application_id: application_id,
  api_key: admin_api_key
}
