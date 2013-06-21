/* A table yo. */

// TODO(jack): Document me.

(function (root, undefined) {
  'use strict';
  var app = root.angular.module('hasOffers.hasTable', ['hasOffers.serviceLayer']);

  app.directive('hasTable', function() {
    return {
      'restrict' : 'E',
      'controller': 'hasTable',
      'templateUrl': 'hasTableBase',
      'replace': true
    };
  });

})(this);
