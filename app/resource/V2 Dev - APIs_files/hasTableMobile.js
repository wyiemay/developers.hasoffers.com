/* A table yo. */

// TODO(jack): Document me.

(function (root, undefined) {
  'use strict';
  var app = root.angular.module('hasOffers.hasTable');

  app.directive('mobileTable', function() {
    return {
      'restrict' : 'E',
      'controller': 'hasTableMobile',
      'templateUrl': 'hasTableMobileBase',
      'replace': true
    };
  });

})(this);
