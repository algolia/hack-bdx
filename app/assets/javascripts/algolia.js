$(document).ready(function() {
  var appId = 'XXX';
  var apiKey = 'XXX';

  if (appId === 'XXX' || apiKey === 'XXX') {
    // Sorry for the alert, but let's make sure it's visible
    var message = 'Wrong Algolia credentials - Replace them in app/assets/algolia.js';
    alert(message);
    throw new Error(message);
  }

  var search = instantsearch({
    appId: appId,
    apiKey: apiKey,
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
