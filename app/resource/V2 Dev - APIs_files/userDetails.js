/*
 * User Details controller // parent scope - account controller.
 */

(function(root, undefined) {
  'use strict';

  root.Application.controller('Controllers.userDetails',
    ['$scope', '$routeParams', 'currentUser', '$location', 'models',
      function($scope, $routeParams, currentUser, $location, models) {

    var model = models.get('affiliateUser');

    $scope.userDetails = root.angular.copy(currentUser.AffiliateUser);
    $scope.editMode = false;
    $scope.userDetailsLoading = false;
    $scope.currentUserLoading = root.angular.copy(currentUser.loading);
    $scope.currentUser = currentUser;

    $scope.isSelf = _($routeParams.id).isUndefined() || $routeParams.id == root.Config.affiliate_user_id;

    // Toggles the user details inputs as editable/uneditable
    var toggleEditableUserDetailsInputs = function(isEditable) {
      $scope.userDetails.wantsEmail = _(currentUser.UserPreferences.disable_mail_room_email).isNull();
      $scope.editMode = isEditable;
    };

    // In the event that this is the first page, the digest cycle won't pick up when the login
    // is finished so we need to wait.
    if (currentUser.loading) {
      $scope.$on('UserLoaded', function(success) {
        if (success) {
          // Only load the current user into the scope if we're not requesting a different user.
          if (!$routeParams.id || $routeParams.id === root.Config.affiliate_user_id) {
            $scope.userDetails = root.angular.copy(currentUser.AffiliateUser);
          }
          $scope.currentUserLoading = false;
        }
      });
    }

    // Function to load the current user details from the API
    $scope.loadUserDetails = function(id) {
      var promise = model.get(id);
      $scope.userDetailsLoading = true;

      promise.success(function(data) {
        $scope.userDetailsLoading = false;
        $scope.userDetails = data.AffiliateUser;
      });

      promise.error(function() {
        $scope.flashError('You do not have access to view that user or the user does not exist.');
        $location.path('/account');
      });
    };

    $scope.auth.cleanPermissionNames = [
      {'name' : 'Reporting', 'field': 'Affiliate.stats'},
      {'name' : 'Offer Management', 'field': 'Affiliate.offer_management'},
      {'name' : 'User Management', 'field': 'Affiliate.user_management'},
      {'name' : 'Account Management', 'field': 'Affiliate.account_management'}
    ];

    $scope.auth.hasPermission = function(field) {
      return _($scope.userDetails.access).contains(field);
    };

    $scope.auth.canEditPermissions = function() {
      var isSelf = $scope.userDetails.id == root.Config.affiliate_user_id;
      return currentUser.hasPermission('user_management') && !isSelf;
    };

    $scope.auth.togglePermission = function(field) {
      var idx = _.indexOf($scope.userDetails.access, field);

      if (idx !== -1) {
        $scope.userDetails.access.splice(idx, 1);
      } else {
        $scope.userDetails.access.push(field);
      }
    };

    $scope.toggleUserDetailsEdit = function() {
      toggleEditableUserDetailsInputs(!$scope.editMode);
    };

    $scope.cancelUserDetailsEdit = function() {
      // Revert user inputs to uneditable
      toggleEditableUserDetailsInputs(false);
      $location.path('/account');
    };

    $scope.saveUserDetails = function() {
      var params = {
        'id' : $scope.userDetails.id,
        'data' : {
          'first_name' : $scope.userDetails.first_name || '',
          'last_name'  : $scope.userDetails.last_name || '',
          'title'      : $scope.userDetails.title || '',
          'email'      : $scope.userDetails.email,
          'phone'      : $scope.userDetails.phone || '',
          'cell_phone' : $scope.userDetails.cell_phone || ''
        }
      };

      // Double check before we change permissions.
      if ($scope.auth.canEditPermissions()) {
        model.setPermissions(params.id, $scope.userDetails.access);
      }

      if ($scope.isSelf) {
        //Check if the preference was altered.
        if (_(currentUser.UserPreferences.disable_mail_room_email).isNull() != $scope.userDetails.wantsEmail) {
          currentUser.setPreferenceValue('disable_mail_room_email', !$scope.userDetails.wantsEmail);
        }
      }


      var promise = model.update(params);
      $scope.userDetailsLoading = true;

      promise.then(function(res) {
        // Users table is related through the parent so we'll broadcast the update from there.
        $scope.$parent.$broadcast('userUpdated');

        var data = res.data;

        $scope.userDetails = data.AffiliateUser;
        if ($scope.userDetails.id === currentUser.AffiliateUser.id) {
          currentUser.refresh();
        }
        $scope.addSuccess('userDetails', 'User updated successfully!');

        $scope.userDetailsLoading = false;
        toggleEditableUserDetailsInputs(false);

      });
    };

    $scope.validPassword = function() {
      // Alpha-numeric + select symbols between 4 and 16 characters.
			return model.isValidPassword($scope.userDetails.password);
    };

    $scope.confirmPassword = function() {
      return $scope.userDetails.password_confirm === $scope.userDetails.password;
    };

    $scope.updatePassword = function() {
      if ($scope.validPassword() && $scope.confirmPassword()) {
        $scope.userDetailsLoading = true;
        model.update({
          'data': {
            'password': $scope.userDetails.password
          },
          'id': $scope.userDetails.id
        })
        .success(function() {
          // No need to have these exposed after the commit.
          delete($scope.userDetails.password);
          delete($scope.userDetails.password_confirm);
          $scope.userDetailsLoading = false;
        });
      }
    };

    var routeOnPermissionFail = function() {
      if (!currentUser.hasPermission('user_management') && !$scope.isSelf) {
        $scope.flashError('You do not have permissions to edit that user.');
        $location.path('/account');
      }
    };

    // need to check if we're requesting a different user, if so then make sure we have permission to edit.
    (function() {
      if (!_.isUndefined($routeParams.id)) {
        if (currentUser.loading) {
          $scope.$on('UserLoaded', function() {
            routeOnPermissionFail();
          });
        } else {
          routeOnPermissionFail();
        }

        if ($routeParams.id != root.Config.affiliate_user_id) {
          $scope.loadUserDetails($routeParams.id);
        }
      }
    })();
  }]);
})(this);
