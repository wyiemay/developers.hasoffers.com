/*
 * offer creative modal controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.offerCreativeModal', ['$scope', function($scope) {
    $scope.offers = [];
    $scope.offers = {};
    $scope.current_index = 0;
    $scope.max_index = 0;

    $scope.moveLeft = function() {
      if ($scope.current_index > 0) {
        $scope.offer = $scope.offers[$scope.current_index - 1];
        $scope.current_index = $scope.current_index - 1;
      }
    };

    $scope.moveRight = function() {
      if ($scope.current_index < $scope.max_index) {
        $scope.offer = $scope.offers[$scope.current_index + 1];
        $scope.current_index = $scope.current_index + 1;
      }
    };

    $scope.getUrlExtension = function() {
      if (_.hasMembers($scope, 'offer', 'OfferFile')) {
        return $scope.offer.OfferFile.url.split('.').pop().toUpperCase();
      }
      return 'Unknown';
    };

    $scope.isImage = function() {
      if (_.hasMembers($scope, 'offer', 'OfferFile')) {
        return ($scope.offer.OfferFile.type == 'image banner');
      }
      return false;
    };

    $scope.getImgTag = function() {
      if ($scope.isImage()) {
        var file = $scope.offer.OfferFile,
            imgRecipe = '<img src="{0}" width="{1}" height="{2}" border="0" alt="{3}"/>';

        return imgRecipe.format(file.url, file.width, file.height, file.display);
      }
      return false;
    };

    $scope.getOfferCode = function() {
      if (_.hasMembers($scope, 'offer', 'OfferFile')) {
        if ($scope.offer.OfferFile.CreativeCode) {
          return $scope.offer.OfferFile.CreativeCode;
        }

        if ($scope.isImage()) {
          return $scope.getImgTag();
        }

        return $scope.offer.OfferFile.code;
      }
    };

    $scope.getCTR = function() {
      if (_.hasMembers($scope, 'offer', 'OfferFile', 'Stat', 'ctr')) {
        return '{0}%'.format($scope.offer.OfferFile.Stat.ctr);
      }
      return '<em>N/A</em>';
    };

    $scope.getEPC = function() {
      if (_.hasMembers($scope, 'offer', 'OfferFile', 'Stat', 'erpc')) {
        return root.currency.formatCurrency($scope.offer.OfferFile.Stat.erpc, 'USD');
      }
      return '<em>N/A</em>';
    };

    $scope.getCR = function() {
      if (_.hasMembers($scope, 'offer', 'OfferFile', 'Stat', 'conversion_revenue')) {
        return '{0}%'.format($scope.offer.OfferFile.Stat.conversion_revenue);
      }
      return '<em>N/A</em>';
    };

    $scope.showAdGroup = function($event) {
      if ($event) {
        $event.preventDefault();
      }
      $scope.dismiss();

      $scope.$parent.launchAdgroup($scope.offer.OfferFile.id);
    };
  }]);
})(this, jQuery);
