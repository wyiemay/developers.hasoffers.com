/*
 * login controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.login',
    [
      '$scope',
      '$location',
      '$rootScope',
      'cookieStorageService',
      'sessionStorageService',
      'hasSession',
      function($scope, $location, $rootScope, cookieStorageService, sessionStorageService, hasSession) {


    // @todo email and password should default to blank
    $scope.UserEmail = 'tara.herndon@example.com';
    $scope.UserPassword = 'test12';


    /**
     * checks user agreement compliance, alerts if they haven't checked the box
     * @return {Boolean}
     */
    $scope.checkAgree = function()
    {
      if ($scope.agreePrivacy && $scope.agreeCookie) {
        if (!$scope.hasAcceptedCookie()) {
          cookieStorageService.add('EUcomp', 1, 60 * 60 * 24 * 365);
        }
        return true;
      }
      $scope.addError('loginResult', '', 'You must agree to the privacy policy and accept cookies to use the application');
      return false;
    };

    /**
     * handles login submit
     * @return {void}
     */
    $scope.submitLogin = function()
    {
      var continueSubmit = true;
      $scope.clearAlert('loginResult');



      if (continueSubmit) {
        $rootScope.incrementLoading();
        hasSession.doLogin($scope.UserEmail, $scope.UserPassword).then(
          function() {
            $rootScope.decrementLoading();
          },
          function(response) {
            $rootScope.decrementLoading();
            $scope.addError('loginResult', '', response.errorMessage);
          }
        );
      }
    };
  }]);

})(this, jQuery);
