/**
 * Offer detial page
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.offerDetail',
    [
      '$scope',
      '$routeParams',
      '$rootScope',
      '$q',
      '$timeout',
      'digestService',
      'models',
      'directiveRegistry',
      function($scope, $routeParams, $rootScope, $q, $timeout, digestService, models, directiveRegistry) {


        // cast model to local scope
        var model = models.get('offerDetail');

        // api request params
        var offerParams = {
          'id'         : $routeParams.offer_id,
          'fields'     : ['Country.name', 'Stat.erpc'],
          'data_start' : moment().subtract(30, 'days').format('YYYY-MM-DD'),
          'data_end'   : moment().format('YYYY-MM-DD'),
          'contain'    : ['Country', 'Stat']
        };

        // flag to determine if offer is loaded or not
        $scope.offerLoaded = false;
        $scope.isError = false;
        $scope.offerId = $routeParams.offer_id;

        // watch panel open states to trigger tracking link refresh
        $scope.$watch('panelObj.panelOpen.default', function(_old, _new) {
          if (_old != _new && (_old == 'tinyurl' || _new == 'tinyurl')) {
            $scope.refreshTrackingLink();
          }
        });

        $scope.offerUrls = [{'id': 0, 'name': 'Default URL'}];
        $scope.trackingLinkOfferUrlId = 0;

        model.getOfferUrls($scope.offerId).then(function(data) {
          _(data.data).each(function(obj) {
            var item = {};
            item.id = obj.OfferUrl.id;
            item.name = obj.OfferUrl.name;
            $scope.offerUrls.push(item);
          });
        });

        $scope.$watch('trackingLinkOfferUrlId', function(_old) {
          if (_.isUndefined(_old) || _.isNull(_old)) {
            return;
          }
          $scope.refreshTrackingLink();
        });

        // container for user-inputs of tracking link params
        $scope.trackingLinkParams = {};

        // local vars
        var trackingCache = {}, // holds api returns based on user selected options
          currentRequest = null; // holds current promise object to allow us to reject last request

        /**
         * populates tracking link textareas from cache object
         * @param  {string} hash md5 of user requested params.
         * @return {void}
         */
        var populateTrackingLink = function(hash) {
          if (trackingCache[hash]) {
            $scope.trackingPixel = trackingCache[hash].impression_pixel;
            $scope.trackingLink = trackingCache[hash].click_url;

            // Close all the open creative code windows to force the user to generate new ones.
            angular.element('.offerfile-codecell').removeClass('code');
          }
        };

        /**
         * handles add parameter clicks
         * @param {event} e     jquery event object.
         * @param {string} which which parameter to populate.
         */
        $scope.addParam = function(e, which) {
          $scope.trackingLinkParams[which] = encodeURIComponent($scope.linkParam[which]);
          $scope.refreshTrackingLink(e);
        };

        /**
         * handles api request and triggers population of tracking lin and tracking pixel display
         * @param  {event} e jquery event object.
         * @return {object} modelRequest angular $http promise object.
         */
        $scope.refreshTrackingLink = function(e) {
          if (e) {
            e.preventDefault();
          }

          // if we have a current request, reject so it won't populate textareas
          if (currentRequest) {
            currentRequest.reject();
          }

          // deferred object and setup api params
          var prom = $q.defer(),
            params = {
              'offer_id' : $routeParams.offer_id,
              'options'  : {}
            };

          if ($scope.trackingLinkOfferUrlId) {
            $scope.trackingLinkParams.url_id = $scope.trackingLinkOfferUrlId;
          } else {
            delete($scope.trackingLinkParams.url_id);
          }

          // process tracking link parameter options
          _.each($scope.trackingLinkParams, function(value, key) {
            if (value !== '') {
              params.options[key] = value;
            }
          });

          // determine if we're asking for tinyurl
          if ($scope.getPanelClass && $scope.getPanelClass('tinyurl') == 'on') {
            params.options.tiny_url = 1;
          }

          // hash params for cache
          var hashCheck = digestService.md5(root.angular.toJson(params)),
            modelRequest;

          // if cache exists, use it
          if (trackingCache[hashCheck]) {
            populateTrackingLink(hashCheck);
            prom.reject();
          } else {
            // doesn't exist, request from api
            modelRequest = model.generateTrackingLink(params).success(function(trackLinkData) {
              // populate cache regardless
              trackingCache[hashCheck] = trackLinkData;

              // resolve promise to trigger population if it hasn't already been rejected
              prom.resolve(true);
            });
          }

          // promise handler
          prom.promise.then(function() {
            populateTrackingLink(hashCheck);
          });

          // set currentRequest to promise object
          currentRequest = prom;
          return modelRequest;
        };

        /**
         * populates expires display
         * @return {string} html to display expires info.
         */
        $scope.getExpiresDisplay = function() {
          if ($scope.offerLoaded) {
            var expires = moment($scope.offerData.Offer.expiration_date),
              days = expires.diff(moment().startOf('day'), 'days'),
              display = expires.format('MM.DD.YYYY'),
              expiresString = ' <span class="expires_in_days">{0}</span> <em>day{1} remaining</em>';

            if ($scope.offerData.Offer.is_expired === '0') {
              display += expiresString.format(days, days > 1 ? 's' : '');
            }
            return display;
          }
        };

        /**
         * does this offer require approval
         * @return {bool}
         */
        $scope.requireApproval = function() {
          if ($scope.offerData && $scope.offerData.Offer) {
            return Number($scope.offerData.Offer.require_approval) === 1 &&
              $scope.offerData.AffiliateOffer.approval_status !== 'approved';
          }
          return true;
        };

        // tracking link functionality
        $scope.socialLinks = [
          'twitter',
          'email',
          'qrcode'
        ];

        /**
         * handles click on social button
         * @param  {event} e    jquery event object.
         * @param  {string} type social "type".
         * @return {void}
         * @TODO implement social buttons
         */
        $scope.social = function(e, type) {
          if (e) {
            e.preventDefault();
          }

          var url = '';
          switch (type) {
            case 'twitter' :
              url = 'http://twitter.com/share?text={0}%20{1}'.format(
                encodeURIComponent('Tracking Link for ' + $scope.offerData.Offer.name),
                encodeURIComponent($scope.trackingLink)
              );
              window.open(url);
              break;

            case 'email' :
              var mailTemplate = 'mailto:?subject={0}&body={1}';
              window.location = mailTemplate.format(
                encodeURIComponent('Tracking Link for ' + $scope.offerData.Offer.name),
                encodeURIComponent($scope.trackingLink)
              );
              break;

            case 'qrcode' :
              url = 'http://www.sparqcode.com/qrgen?qt=url&data={0}&cap={1}'.format(
                encodeURIComponent($scope.trackingLink),
                encodeURIComponent($scope.offerData.Offer.name)
              );
              $scope.qrCodeUrl = url;
              directiveRegistry.get('qrCodeModal').show();
              break;
          }
        };

        // finally, get all the data we need to display the page
        $q.all([
            model.getOffer(offerParams).success(function(offerData) {
              $scope.offerData = offerData;
            }),
            model.getThumbnail($routeParams.offer_id).success(function(data) {
              if (data.length > 0 && data[0].Thumbnail) {
                var keys = _.keys(data[0].Thumbnail);
                $scope.offerThumbData = data[0].Thumbnail[keys[0]];
              }
            }),
            $scope.refreshTrackingLink()
          ]).then(function() {
            // determine country list display
            if (_.size($scope.offerData.Country) > 0) {
              $scope.countryList = _.pluck($scope.offerData.Country, 'name').join(', ');
            } else {
              $scope.countryList = 'All';
            }

            var offer = $scope.offerData.Offer;

            // determine epc display
            if ($scope.offerData.Stat && $scope.offerData.Stat.erpc) {
              $scope.epcDisplay = root.currency.formatCurrency($scope.offerData.Stat.erpc, 'USD');
            } else {
              $scope.epcDisplay = 'N/A';
            }

            // determine payout list
            var typesList = models.get('offers').getOfferTypes(),
                type = offer.payout_type,
                format = typesList[type].type,
                currency = offer.currency,
                amount;

            switch (format) {
              case 'money' :
                amount = root.currency.formatCurrency(offer.default_payout, currency);
                break;
              case 'percentage' :
                amount = '{0}%'.format(offer.percent_payout);
                break;
              case 'both' :
                amount = '{0} + {1}%'.format(
                  root.currency.formatCurrency(offer.default_payout, currency),
                  offer.percent_payout
                );
                break;
            }

            // Email instructions contain new line characters so we need to handle them specially.
            if (offer.email_instructions === '1') {
              $scope.offerData.from_instructions = $.trim(offer.email_instructions_from).split(/\n/);
              $scope.offerData.subject_instructions = $.trim(offer.email_instructions_subject).split(/\n/);
            }

            $scope.payoutList = [];

            $scope.payoutList.push({
              'name'   : 'Default',
              'type'   : typesList[type].title,
              'amount' : amount
            });

            $scope.offerLoaded = true;

            if (!$scope.requireApproval()) {
              model.getRingRevenueLink($scope.offerData.Offer.id).success(function(data) {
                $scope.ringRevenueLink = data;
              });
            }

            if ($scope.requireApproval()) {
              $timeout(function() {
                $scope.$broadcast('approvalRequired', $scope.offerData.Offer.id);
              });
            }
          }, function() {
            $scope.isError = true;
          });

        /**
         * quick fix for an issue where the table in the pixels/postbacks section doesn't properly set table width
         * @todo  can be removed once that particular table no longer uses jqgrid, also make sure to remove the call from
         *        offer-single.html as well
         */
        $scope.triggerResize = function() {
          $(root).resize();
        };
  }]);

})(this, jQuery);
