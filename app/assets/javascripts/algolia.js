$(document).ready(function() {
  var appId = 'XXX';
  var apiKey = 'XXX';

  if (appId === 'XXX' || apiKey === 'XXX') {
    // Sorry for the alert, but let's make sure it's visible
    var message = 'Wrong Algolia credentials - Replace them in app/assets/algolia.js';
    alert(message);
    throw new Error(message);
  }

  /* global instantsearch */

  app({
    appId: appId,
    apiKey: apiKey, // search API key
    indexName: 'Wine',
  });

  function app(opts) {
    // ---------------------
    //
    //  Init
    //
    // ---------------------
    const search = instantsearch({
      appId: opts.appId,
      apiKey: opts.apiKey,
      indexName: opts.indexName,
      urlSync: true,
    });

    // ---------------------
    //
    //  Default widgets
    //
    // ---------------------
    search.addWidget(
      instantsearch.widgets.searchBox({
        container: '#search-input',
        placeholder: 'Search for wine 🍷',
      })
    );

    search.addWidget(
      instantsearch.widgets.hits({
        container: '#hits',
        hitsPerPage: 10,
        templates: {
          item: getTemplate('hit'),
          empty: getTemplate('no-results'),
        },
        transformData: {
          item: function(item) {
            item.starsLayout = getStarsHTML(item.rating);
            item.categories = getCategoryBreadcrumb(item);
            return item;
          },
        },
      })
    );

    search.addWidget(
      instantsearch.widgets.stats({
        container: '#stats',
      })
    );

    search.addWidget(
      instantsearch.widgets.pagination({
        container: '#pagination',
        scrollTo: '#search-input',
      })
    );

    // ---------------------
    //
    //  Filtering widgets
    //
    // ---------------------
    search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#domain',
        attributeName: 'domain',
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        searchForFacetValues: {
          placeholder: 'Search for domains',
          templates: {
            noResults: '<div class="sffv_no-results">No matching domains.</div>',
          },
        },
        templates: {
          header: getHeader('Domain'),
        },
      })
    );

    search.addWidget(
      instantsearch.widgets.rangeSlider({
        container: '#year',
        attributeName: 'year',
        tooltips: {
          format: rawValue => rawValue,
        },
        templates: {
          header: getHeader('Year'),
        },
      })
    );

    search.addWidget(
      instantsearch.widgets.rangeSlider({
        container: '#price',
        attributeName: 'price',
        tooltips: {
          format: function(rawValue) {
            return `$${Math.round(rawValue).toLocaleString()}`;
          },
        },
        templates: {
          header: getHeader('Price'),
        },
      })
    );

    search.addWidget(
      instantsearch.widgets.menu({
        container: '#type',
        attributeName: 'type',
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        limit: 10,
        showMore: true,
        templates: {
          header: getHeader('Type'),
        },
      })
    );

    search.start();
  }

  // ---------------------
  //
  //  Helper functions
  //
  // ---------------------
  function getTemplate(templateName) {
    return document.querySelector(`#${templateName}-template`).innerHTML;
  }

  function getHeader(title) {
    return `<h5>${title}</h5>`;
  }

  function getCategoryBreadcrumb(item) {
    const highlightValues = item._highlightResult.categories || [];
    return highlightValues.map(category => category.value).join(' > ');
  }

  function getStarsHTML(rating, maxRating) {
    let html = '';
    maxRating = maxRating || 5;

    for (let i = 0; i < maxRating; ++i) {
      html += `<span class="ais-star-rating--star${i < rating ? '' : '__empty'}"></span>`;
    }

    return html;
  }
});
