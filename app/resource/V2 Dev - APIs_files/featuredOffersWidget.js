/* featured offers widget */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.Widgets.featuredOffers',
    ['$scope', '$q', 'models',
    function($scope, $q, models) {
    $scope.offersLoaded = false;

    var params = {
      'contain' : {
        'OfferCategory' : {
          'filter': { 'OfferCategory.status' : 'active'},
          'fields': ['OfferCategory.status', 'OfferCategory.name']
        },
        'Thumbnail': {
          'fields': ['Thumbnail.url']
        }
      },
      'fields': [
        'id',
        'thumbnail',
        'name',
        'OfferCategory.name',
        'Thumbnail.url',
        'percent_payout',
        'payout_type',
        'default_payout',
        'currency'
      ]
    };
    var model = models.get('offers');

    model.getFeaturedOffers(params, $q).then(function(data) {

      var types = model.getOfferTypes();

      $scope.featuredOffers = _.chain(data)
        .toArray()
        .map(function(row) {
          var payoutType = types[row.Offer.payout_type];
          if (payoutType) {
            row.payout_type = payoutType.title;
          }

          if (_.size(row.OfferCategory) > 0) {
            row.category = _(row.OfferCategory).pluck('name').slice(0, 4).join(' ');
          } else {
            row.category = 'None';
          }
          return row;
        })
        .value();

      $scope.offersLoaded = true;
    });

  }]);

})(this, jQuery);
