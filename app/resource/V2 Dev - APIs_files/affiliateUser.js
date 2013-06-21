/*
 * affiliate user model
 */

(function(root, $, undefined) {
  'use strict';

  var AffiliateUserService = ['api', 'models', function(api, models) {
    var AffiliateUserModel = models.getExtendable('base').extend({

      name: 'affiliateUser',

      init: function() {
        this._super();
      },

      /*
       * Gets Affiliate User data
       * @param affiliate_user_id Affiliate user id to search for.
       * @returns promise object
       */
      get: function(affiliate_user_id) {
        return root.Api.get('AffiliateUser/findById', {'id' : affiliate_user_id});
      },

      /*
       * Updates an affiliate user.
       *
       * @param params - object of user fields to be updated.
       * @returns promise object.
       */
      update: function(params) {
        return root.Api.get('AffiliateUser/update', params);
      },

      /**
       * Creates a new affiliate user on the current affiliate account.
       * @param params - object of user fields to be created.
       * @return an angular promise object.
       */
      create: function(params) {
        return root.Api.get('AffiliateUser/create', params);
      },

      setPermissions: function(id, perms) {
        // The first field in the permission array is always 'Affiliate' which isn't a valid perm to send back.
        if (perms && perms[0] === 'Affiliate') {
          perms.shift();
        }
        var params = {
          'affiliate_user_id': id,
          'permissions': perms
        };
        root.Api.get('AffiliateUser/setPermissions', params);
      },

      /*
       * Gets all user for an affiliate.
       * @param aff_id Affiliate Id to retrieve users for
       * @returns an angular promise object.
       */
      getAllAffiliateUsers: function(params) {
        var promise = root.Api.get('AffiliateUser/findAll', params).success(
          function(data) {
            // convert the funky hash map returned into an ol' fashioned array.
            var outData = [];
            _.each(data.data, function(val) {
              outData.push(val.AffiliateUser);
            });
            data.data = outData;
            return data;
          }
        );

        return promise;
      },

      getDefinition: function() {
        return {
          'entity' : 'AffiliateUser',
          'nicename' : 'AffiliateUser',
          'nameField' : 'email',
          'fields' : {
            'id' :  this.getStandardDef('id'),
            'affiliate_id': {type: 'integer'},
            'email': {type: 'string'},
            'first_name': {'type': 'string'},
            'last_name': {type: 'string'},
            'status': {'type': 'enum', 'values': {'active': 'Active', 'blocked' : 'Blocked', 'deleted': 'Deleted'}},
            'title': {'type': 'string'},
            'phone': {'type': 'string'},
            'cell_phone': {'type': 'string'},
            'permissions': {'type': 'string'},
            'access': {'type': 'array'},
            'wants_alerts': {'type': 'enum', 'values': {0: 'No', 1: 'Yes'}},
            'is_creator': {'type': 'enum', 'values': {0: 'No', 1: 'Yes'}},
            'user_id': {'type': 'int'},
            'join_date' : this.getStandardDef('created'),
            'modified' : this.getStandardDef('modified'),
            'last_login': this.getStandardDef('modified')
          }
        };
      },

       /* Tests if a string meets the password requirements.
       * Which are an Alpha numeric string with at least 4 and no more than 16 characters.
       *
       * @param value - String to test.
       * @return {Boolean} The match result.
       */
      isValidPassword: function(value) {
        return (/^[a-zA-Z0-9]{4,16}$/).test(value);
      },

      isValidEmail: function(value) {
        // checks for [characters]@[domain].[suffix]
        return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(value);
      }
    });

    return AffiliateUserModel;
  }];

  // scope to root
  root.Models.affiliateUser = AffiliateUserService;
})(this, jQuery);
