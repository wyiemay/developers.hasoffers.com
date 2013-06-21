/**
 * controls creation of pixel/postback
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.createPixelPostback',
    ['$scope', '$routeParams', 'models', 'directiveRegistry',
      function($scope, $routeParams, models, directiveRegistry) {

    /**
     * flag to reload if creative added
     * @type {Boolean}
     */
    var reloadParentGrid = false,
        offerPixelModel = models.get('offerPixel');

    // setup page/default data
    $scope.pixelData = {};
    $scope.define = offerPixelModel.getOfferPixelDefinition();

    $scope.codeTypes = {};
    var allowedTypesPromise = offerPixelModel.getAllowedTypes($routeParams.offer_id);
    allowedTypesPromise.success(function(data) {
      _(data).each(function(type) {
        $scope.codeTypes[type] = $scope.define.fields.type.values[type];
      });
    });

    /**
     * list of variables you can insert into code
     * @type {Array}
     */
    $scope.optionalVariables = [
      {'value' : '{offer_id}', 'description' : 'ID of offer.'},
      {'value' : '{offer_name}', 'description' : 'Name of offer.'},
      {'value' : '{offer_ref}', 'description' : 'Reference ID for offer.'},
      {'value' : '{goal_id}', 'description' : 'ID of goal for offer.'},
      {'value' : '{affiliate_id}', 'description' : 'ID of affiliate.'},
      {'value' : '{affiliate_name}', 'description' : 'Company name of affiliate.'},
      {'value' : '{affiliate_ref}', 'description' : 'Reference ID for affiliate.'},
      {'value' : '{source}', 'description' : 'Source value specified in the tracking link.'},
      {'value' : '{aff_sub}', 'description' : 'Affiliate sub specified in the tracking link.'},
      {'value' : '{aff_sub2}', 'description' : 'Affiliate sub 2 specified in the tracking link.'},
      {'value' : '{aff_sub3}', 'description' : 'Affiliate sub 3 specified in the tracking link.'},
      {'value' : '{aff_sub4}', 'description' : 'Affiliate sub 4 specified in the tracking link.'},
      {'value' : '{aff_sub5}', 'description' : 'Affiliate sub 5 specified in the tracking link.'},
      {'value' : '{offer_url_id}', 'description' : 'ID of offer URL for offer.'},
      {'value' : '{offer_file_id}', 'description' : 'ID of creative file for offer.'},
      {'value' : '{file_name}', 'description' : 'Name of creative file for offer.'},
      {'value' : '{advertiser_id}', 'description' : 'ID of advertiser.'},
      {'value' : '{advertiser_ref}', 'description' : 'Reference ID for affiliate.'},
      {'value' : '{adv_sub}', 'description' : 'Advertiser sub specified in the conversion pixel / URL.'},
      {
        'value' : '{transaction_id}',
        'description' : "ID of the transaction for your network. Don't get confused with " +
          "an ID an affiliate passes into aff_sub."
      },
      {'value' : '{session_ip}', 'description' : 'IP address that started the tracking session.'},
      {'value' : '{ip}', 'description' : 'IP address that made the conversion request.'},
      {'value' : '{date}', 'description' : 'Current date of conversion formatted as YYYY-MM-DD.'},
      {'value' : '{time}', 'description' : 'Current time of conversion formatted as HH:MM:SS.'},
      {
        'value' : '{datetime}',
        'description' : 'Current date and time of conversion formatted as YYYY-MM-DD HH:MM:SS.'
      },
      {'value' : '{ran}', 'description' : 'Randomly generated number.'},
      {'value' : '{currency}', 'description' : '3 digit currency abbreviated.'},
      {'value' : '{payout}', 'description' : 'Amount paid to affiliate for conversion.'},
      {'value' : '{sale_amount}', 'description' : 'Sale amount generated for advertiser from conversion.'},
      {'value' : '{device_id}', 'description' : "For mobile app tracking, the ID of the user's mobile device."}
    ];

    /**
     * determines cursor position and/or selection and inserts chosen variable
     * @param {jquery event} e    jquery event object.
     * @param {string} _var variable to insert.
     */
    $scope.addVariable = function(e, _var) {
      if (e) {
        e.preventDefault();
      }

      // need to determine element in order to use jquery caret plugin
      var elm = root.angular.element('#pixel-postback-code-input'),
        fullText = $scope.pixelData.code || '',
        start = elm.caret().start,
        end = elm.caret().end,
        code = [
          fullText.substr(0, start),
          _var,
          fullText.substr(end)
        ];

      $scope.pixelData.code = code.join('');

    };

    /**
     * modal close handler to trigger reload of creatives grid if necessary
     * @return {void}
     */
    $scope.onModalClose = function() {
      if (reloadParentGrid) {
        if ($scope.isMobile) {
          directiveRegistry.onDirectivesReady(['pixelsTableMobile'], function() {
            $scope.table = directiveRegistry.get('pixelsTableMobile');
            $scope.table.$broadcast('refresh');
          });
        } else {
          directiveRegistry.onDirectivesReady(['pixelsTable'], function() {
            $scope.table = directiveRegistry.get('pixelsTable');
            $scope.table.$broadcast('refresh');
          });
        }
      }

      // reset to defaults
      $scope.clearAlert('pixelSaveResult');
      $scope.pixelData = {};
      reloadParentGrid = false;
    };

    /**
     * saves pixel/postback
     * @return {void}
     */
    $scope.save = function() {
      $scope.clearAlert('pixelSaveResult');
      $scope.pixelData.offer_id = $routeParams.offer_id;

      offerPixelModel.createOfferPixel($scope.pixelData)
        .success(function() {
          reloadParentGrid = true;
          $scope.$parent.pixelAdded();
          $scope.dismiss();
        })
        .error(function(data) {
          $scope.errors = data;
        });
    };
  }]);

})(this, jQuery);
