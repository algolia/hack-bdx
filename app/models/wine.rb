class Wine < ApplicationRecord
  self.inheritance_column = nil

  include AlgoliaSearch
  algoliasearch do
    # All the attributes to send to algolia (in this case, everything)
    attributes :name, :domain, :type, :year, :quantity, :quality, :price, :image
    # All the attributes we want to search in
    # unordered means that te position of the word(s) which matched doesn't matter
    searchableAttributes ['unordered(name)', 'domain', 'year', 'type']
    # Attribute(s) to use when sorting with the same textual match
    customRanking ['desc(quality)']
    attributesForFaceting ['searchable(domain)']
  end
end
