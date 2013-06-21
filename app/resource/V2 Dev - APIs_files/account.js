/*
 * Account controller
 */
(function(root, undefined) {
  'use strict';

  root.Application.controller('Controllers.account',
    ['$scope', 'currentUser', '$location', 'geographic', 'models',
      function($scope, currentUser, $location, geographic, models) {

    $scope.user = currentUser.AffiliateUser;
    $scope.affiliate = currentUser.Affiliate;
    $scope.currentUserLoading = currentUser.loading;
		$scope.auth = {};
    $scope.affiliateCountries = [];
		$scope.newUser = {'access': []};
    $scope.geo = geographic;
    $scope.affiliateEditMode = false;

    var model = models.get('affiliateUser');

    if (geographic.loaded) {
      $scope.affiliateCountries = geographic.getCountries();
    } else {
      $scope.$on('geoInfoLoaded', function() {
        $scope.affiliateCountries = geographic.getCountries();
      });
    }

    $scope.$on('UserLoaded', function(success) {
      if (success) {
        $scope.user = currentUser.AffiliateUser;
        $scope.affiliate = currentUser.Affiliate;
        $scope.currentUserLoading = false;
        $scope.affiliateLoading = false;
      }
    });

    $scope.isAccountManager = function() {
      return currentUser.hasPermission('account_management');
    };

    $scope.canEditUsers = function() {
      return currentUser.hasPermission('user_management');
    };

    $scope.buildUserRegionLine = function() {
      var affiliate = currentUser.Affiliate,
          out = [];

      _.each([affiliate.city, affiliate.region, affiliate.zipcode], function(piece) {
        if (piece) {
          out.push(piece);
        }
      });
      return out.join(', ');
    };

		$scope.auth.cleanPermissionNames = [
			{'name': 'Reporting', 'field': 'stats'},
			{'name': 'Offer Management', 'field': 'offer_management'},
			{'name': 'User Management', 'field': 'user_management'},
			{'name': 'Account Management', 'field': 'account_management'}
		];

		// All the validation functions for the create user modal
		$scope.newUser.isValidPassword = function() {
			// Alpha-numeric + select symbols between 4 and 16 characters.
			return model.isValidPassword($scope.newUser.password);
		};

		$scope.newUser.confirmPassword = function() {
			return $scope.newUser.password_confirm === $scope.newUser.password;
		};

		$scope.newUser.isValidEmail = function() {
			// Standard email validation. Nothing fancy.
			return model.isValidEmail($scope.newUser.email);
		};

		$scope.newUser.isValid = function() {
			return this.isValidEmail() && this.isValidPassword() && this.confirmPassword();
		};

		$scope.newUser.create = function() {
      $scope.newUser.error = '';
			var params = {
        'data': {
          'affiliate_id'          : currentUser.Affiliate.id,
          'first_name'            : $scope.newUser.first_name,
          'last_name'             : $scope.newUser.last_name,
          'title'                 : $scope.newUser.title || '',
          'email'                 : $scope.newUser.email,
          'phone'                 : $scope.newUser.phone || '',
          'cell_phone'            : $scope.newUser.cell_phone || '',
          'password'              : $scope.newUser.password,
          'password_confirmation' : $scope.newUser.password_confirm
        }
			};

			var promise = model.create(params);
      promise.success(function(data) {
        $scope.$broadcast('userCreated');
        $location.path('/account/' + data.AffiliateUser.id);
      });

      promise.error(function(data) {
        $scope.newUser.error = data.errorDetails;
      });
    };


    /**
     * toggles Affiliate Edit Mode
     * @return {void}
     */
    $scope.toggleAffiliateEdit = function() {
      $scope.affiliateEditMode = ($scope.affiliateEditMode === true) ? false : true;
    };

    $scope.editAffiliate = function() {
      $scope.affiliateEditMode = true;
    };

    $scope.cancelAffiliateEdit = function() {
      $scope.affiliate = root.angular.copy(currentUser.Affiliate);
      $scope.affiliateEditMode = false;
    };

    $scope.saveAffiliateInfo = function() {
      var aff = $scope.affiliate;
      var params = {
        'id'  : root.Config.affiliate_id,
        'data': {
          'company'  : aff.company,
          'address1' : aff.address1,
          'address2' : aff.address2,
          'city'     : aff.city,
          'country'  : aff.country,
          'region'   : aff.region,
          'zipcode'  : aff.zipcode,
          'phone'    : aff.phone,
          'fax'      : aff.fax
        }
      };

      $scope.affiliateLoading = true;
      models.get('affiliate').updateAffiliate(params).success(function() {
        currentUser.refresh();
        $scope.affiliateEditMode = false;
      });

    };

    $scope.$watch('affiliate.country', function(newCountry) {
      var regionTypes = {
        'US': 'State',
        'CA': 'Province'
      };

      $scope.affiliateRegionType = regionTypes[newCountry] || 'Province/Territory';
      $scope.affiliateRegions = geographic.getCountryRegions(newCountry);
    });

  }]);
})(this);
