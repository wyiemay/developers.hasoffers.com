/*
 * offers model
 */

(function(root, $, undefined) {
  'use strict';

  var OffersService = ['api', 'models', 'geographic', function(api, models, geographic) {
    // create models class
    var OffersModel = models.getExtendable('base').extend({

      name: 'offers',
      simpleCountryList: [],

      init: function() {
        this._super();
      },

      /**
       * gets list of offers
       * @param  {object} params   api parameters.
       * @param  {object} $scope   angular scope object.
       * @param  {string} property scope proprty to modify.
       * @return {object}          angular promise object.
       */
      getOffers: function(params, $scope, property) {
        var offers = api.get('Offer/findAll', params);

        if ($scope && property) {
          this.populateScope(offers, $scope, property);
        }
        return offers;
      },

      /**
       * gets list of my offers
       * @param  {object} params   api parameters.
       * @param  {object} $scope   angular scope object.
       * @param  {string} property scope proprty to modify.
       * @return {object}          angular promise object.
       */
      getMyOffers: function(params, $scope, property) {
        var offers = api.get('Offer/findMyOffers', params);

        if ($scope && property) {
          this.populateScope(offers, $scope, property);
        }
        return offers;
      },

      /**
       * determines and returns featured offer data
       * @param  {object} params any params needed for api call.
       * @param  {object} $q     angular deferred object.
       * @return {object}        angular promise object.
       */
      getFeaturedOffers: function(params, $q) {
        var deferred = $q.defer(),
          $this = this;

        api.get('Offer/findAllFeaturedOfferIds').success(function(featuredOffers) {
          params.filters = params.filters || {};
          params.filters.id = featuredOffers;
          $this.getOffers(params).success(function(offerData) {
            deferred.resolve(offerData);
          });

        });

        return deferred.promise;
      },

      /**
       * Get list of Stats containing 7-day EPC values
       * @param  {array}  offerIds
       * @return {object} angular promise object
       */
      getEPCForOffers : function(offerIds) {
        var params = {
          'fields' : ['Stat.offer_id', 'Stat.erpc'],
          'groups' : ['Stat.offer_id'],
          'limit'  : offerIds.length,
          'filters' : {
            'Stat.offer_id' : {
              'conditional' : 'EQUAL_TO',
              'values'      : offerIds
            },
            'Stat.date' : {
              'conditional' : 'BETWEEN', // Between now and 7 days ago so we get a 7-day EPC back
              'values'      : [moment().subtract(7, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]
            }
          }
        };

        return api.get('Report/getStats', params);
      },

      /**
       * Get list of Thumbnails for multiple offers
       * @param  {array}  offerIds
       * @return {object} angular promise object
       */
      getThumbnailForOffers : function(offerIds) {
        return api.get('Offer/getThumbnail', {ids : offerIds});
      },

      /**
       * Get list of Categories for multiple offers
       * @param  {array}  offerIds
       * @return {object} angular promise object
       */
      getCategoriesForOffers : function(offerIds) {
        return api.get('Offer/getCategories', {ids : offerIds});
      },

      /**
       * Get list of Countries for multiple offers
       * @param  {array}  offerIds
       * @return {object} angular promise object
       */
      getCountriesForOffers : function(offerIds) {
        return api.get('Offer/getTargetCountries', {ids : offerIds});
      },

      /**
       * Gets Countries data
       * @param $scope angular $scope.
       * @param property $scope property to populate.
       * @return promise object
       */
      getCountries: function($scope, property, params) {
        var countries = api.get('Application/findAllCountries', params);

        if ($scope && property) {
          this.populateScope(countries, $scope, property);
        }

        countries.success(function(data) {
          $scope.simpleCountryList = [];
          $scope.countries = [];
          $scope.countryObject = {};
          _(data).each(function(country) {
            $scope.countries.push(country.Country);
            $scope.simpleCountryList.push(country.Country.name);
            $scope.countryObject[country.Country.code] = country.Country.name;
          });
        });

        return countries;
      },

      /*
       * Gets category data
       * @param $scope angular $scope
       * @param property $scope property to populate
       * @returns promise object
       */
      getCategories: function($scope, property) {
        return this.getChoices(
          $scope, property,
          'Application/findAllOfferCategories',
          {'sort' : {'OfferCategory.name' : 'asc'}},
          {'entity' : 'OfferCategory', 'label' : 'name', 'value' : 'id'}
        );
      },

      /**
       * gets offer choices
       * @param  {object} $scope   angular scope object.
       * @param  {string} property property to set in scope.
       * @return {void}
       */
      getOfferChoices: function($scope, property) {
        return this.getChoices(
          $scope,
          property,
          'Offer/findAll',
          {'sort' : {'Offer.name' : 'asc'}, 'fields' : ['name', 'id'], 'limit' : 0},
          {
            'entity'         : 'Offer',
            'label'          : 'name',
            'value'          : 'id',
            'default_choice' : {'value' : '', 'label' : 'Select Offer'}
          }
        );
      },

      /**
       * gets goal choices
       * @param  {object} $scope   angular scope object.
       * @param  {string} property property to set in scope.
       */
      getGoalChoices: function($scope, property) {
        var params = {
          'fields': [
            'id',
            'name',
            'Offer.name'
          ],
          'contain': {
            'Offer': {
              'fields': ['id', 'name']
            }
          }
        };
        var outGoals = [{'value' : '', 'label' : 'Select Goal'}];

        var promise = api.get('Goal/findAll', params);

        promise.success(function(data) {
          outGoals.push({
            'value' : 0,
            'label' : 'Default Goal'
          });

          _.each(data, function(value) {
            outGoals.push({
              'value' : value.Goal.id,
              'label' : value.Goal.name,
              'group' : value.Offer ? value.Offer.name : 'No Associated Offer'
            });
          });

          outGoals.sort(function(a, b) {
            var sortIndex = 0;
            if (a.group > b.group) {
              sortIndex = 1;
            } else if (a.group < b.group) {
              sortIndex = -1;
            } else if (a.value > b.value) {
              sortIndex = 1;
            } else if (a.value < b.value) {
              sortIndex = -1;
            } else {
              sortIndex = 0;
            }
            return sortIndex;
          });
          $scope[property] = outGoals;
        });
        return promise;
      },

      /**
       * gets category choices
       * @return {void}
       */
      getCategoryChoices: function($scope, property) {
        return this.getChoices(
          $scope, property,
          'Application/findAllOfferCategories',
          {'sort' : {'OfferCategory.name' : 'asc'}},
          {
            'entity'         : 'OfferCategory',
            'label'          : 'name',
            'value'          : 'id',
            'default_choice' : {'value' : '', 'label' : 'Select Category'}
          }
        );
      },

      /**
       * gets OfferUrl choices
       * @param  {object} $scope   angular scope object.
       * @param  {string} property property to set in scope.
       * @return {void}
       */
      getOfferUrlChoices: function($scope, property) {
        return this.getChoices(
          $scope, property,
          'OfferUrl/findAll',
          {'sort' : {'OfferUrl.name' : 'asc'}, 'fields' : ['name', 'id'], 'limit' : 0},
          {
            'entity'         : 'OfferUrl',
            'label'          : 'name',
            'value'          : 'id',
            'default_choice' : {'value' : '', 'label' : 'Select Offer Url'}
          }
        );
      },

      /**
       * gets OfferFile choices
       * @param  {object} $scope   angular scope object.
       * @param  {string} property property to set in scope.
       * @return {void}
       */
      getOfferFileChoices: function($scope, property) {
        return this.getChoices(
          $scope, property,
          'OfferFile/findAll',
          {'sort' : {'OfferFile.display' : 'asc'}, 'fields' : ['display', 'id'], 'limit' : 10000},
          {
            'entity'         : 'OfferFile',
            'label'          : 'display',
            'value'          : 'id',
            'default_choice' : {'value' : '', 'label' : 'Select Offer File'}
          }
        );
      },

      /**
       * gets Country choices
       * @param  {object} $scope   angular scope object.
       * @param  {string} property property to set in scope.
       */
      getCountryChoices: function($scope, property) {
        var countries = geographic.getCountries(),
            options = [{'value' : '', 'label' : 'Select Country'}];

        _.each(countries, function convertCountries(country)  {
          options.push({'value' : country.code, 'label' : country.name});
        });
        $scope[property] = options;
        // need to return a value so we can check for loading status.
        return {};
      },

      getOfferTypes: function() {
        return {
          'cpa_flat' : {
            'title'      : 'CPA',
            'full_title' : 'Cost per Conversion (CPA)',
            'type'       : 'money'
          },
          'cpa_percentage' : {
            'title'      : 'CPS',
            'full_title' : 'Cost per Sale (CPS)',
            'type'       : 'percentage'
          },
          'cpa_both' : {
            'title'      : 'CPA + CPS',
            'full_title' : 'Cost per Conversion plus Cost per Sale (CPA + CPS)',
            'type'       : 'both'
          },
          'cpc' : {
            'title'      : 'CPC',
            'full_title' : 'Cost per Click (CPC)',
            'type'       : 'money'
          },
          'cpm' : {
            'title'      : 'CPM',
            'full_title' : 'Cost per Thousand Impressions (CPM)',
            'type'       : 'money'
          }
        };
      },

      /**
       * returns offers entity definition
       * @return {object} definition meta data.
       */
      getOffersDefinition: function() {
        return {
          'entity' : 'Offer',
          'fields' : {
            'advertiser_id'                   : {'type' : 'integer'},
            'allow_direct_links'              : {'type' : 'boolean'},
            'allow_multiple_conversions'      : {'type' : 'boolean'},
            'allow_website_links'             : {'type' : 'boolean'},
            'approve_conversions'             : {'type' : 'boolean'},
            'click_macro_url'                 : {'type' : 'url'},
            'conversion_cap'                  : {'type' : 'boolean'},
            'conversion_ratio_threshold'      : {'type' : 'integer'},
            'converted_offer_id'              : {'type' : 'integer'},
            'converted_offer_type'            : {'type' : 'string'},
            'converted_offer_url'             : {'type' : 'url'},
            'currency'                        : {'type' : 'string'},
            'customer_list_id'                : {'type' : 'integer'},
            'default_goal_name'               : {'type' : 'string'},
            'default_payout'                  : {'type' : 'currency', 'nicename' : 'Payout'},
            'default_scrub'                   : {'type' : 'boolean'},
            'description'                     : {'type' : 'string'},
            'disable_click_macro'             : {'type' : 'boolean'},
            'display_advertiser'              : {'type' : 'boolean'},
            'dne_download_url'                : {'type' : 'url'},
            'dne_list_id'                     : {'type' : 'integer'},
            'dne_unsubscribe_url'             : {'type' : 'url'},
            'email_instructions'              : {'type' : 'boolean'},
            'email_instructions_from'         : {'type' : 'email'},
            'email_instructions_subject'      : {'type' : 'string'},
            'enable_offer_whitelist'          : {'type' : 'boolean'},
            'enforce_encrypt_tracking_pixels' : {'type' : 'boolean'},
            'enforce_geo_targeting'           : {'type' : 'boolean'},
            'expiration_date'                 : {'type' : 'date'},
            'featured'                        : {'type' : 'boolean'},
            'has_goals_enabled'               : {'type' : 'boolean'},
            'hostname_id'                     : {'type' : 'integer'},
            'id'                              : {'type' : 'integer'},
            'is_expired'                      : {'type' : 'boolean'},
            'is_private'                      : {'type' : 'boolean'},
            'is_seo_friendly_301'             : {'type' : 'boolean'},
            'is_subscription'                 : {'type' : 'boolean'},
            'max_payout'                      : {'type' : 'currency'},
            'max_percent_payout'              : {'type' : 'percent'},
            'modified'                        : {'type' : 'timestamp'},
            'monthly_conversion_cap'          : {'type' : 'boolean'},
            'monthly_payout_cap'              : {'type' : 'currency'},
            'monthly_revenue_cap'             : {'type' : 'currency'},
            'name'                            : {'type' : 'string'},
            'note'                            : {'type' : 'string'},
            'offer_url'                       : {'type' : 'url'},
            'payout_cap'                      : {'type' : 'currency'},
            'payout_type' : {
              'type' : 'enum',
              'values': {
                'cpa_flat':
                'CPA',
                'cpa_percentage':
                'CPA&nbsp;%',
                'cpa_both':
                'CPA&nbsp;+&nbsp;CPA&nbsp;%',
                'cpc':
                'CPC',
                'cpm': 'CPM'
              }
            },
            'percent_payout'               : {'type' : 'currency'},
            'preview_url'                  : {'type' : 'url'},
            'protocol'                     : {'type' : 'string'},
            'rating'                       : {'type' : 'integer'},
            'redirect_offer_id'            : {'type' : 'integer'},
            'ref_id'                       : {'type' : 'string'},
            'require_approval'             : {'type' : 'boolean'},
            'require_terms_and_conditions' : {'type' : 'boolean'},
            'revenue_cap'                  : {'type' : 'currency'},
            'revenue_type'                 : {'type' : 'string'},
            'session_hours'                : {'type' : 'integer'},
            'session_impression_hours'     : {'type' : 'integer'},
            'set_session_on_impression'    : {'type' : 'boolean'},
            'show_custom_variables'        : {'type' : 'boolean'},
            'show_mail_list'               : {'type' : 'boolean'},
            'status'                       : {'type' : 'string'},
            'subscription_duration'        : {'type' : 'integer'},
            'subscription_frequency'       : {'type' : 'integer'},
            'terms_and_conditions'         : {'type' : 'string'},
            'tiered_payout'                : {'type' : 'boolean'},
            'tiered_revenue'               : {'type' : 'boolean'}
          },
          'related_entities' : {

            'OfferCategory' : {
              'nicename'  : 'Offer Category',
              'groupable' : true,
              'fields' : {
                'id'   : {'type' : 'integer'},
                'name' : {'type' : 'string', 'nicename' : 'Category'}
              }
            },

            'Country' : {
              'groupable' : true,
              'fields' : {
                'id'   : {'type' : 'integer'},
                'name' : {'type' : 'string', 'nicename' : 'Country'},
                'code' : {'type' : 'string', 'nicename' : 'Country Code'}
              }
            },

            'OfferUrl' : {
              'nicename'  : 'Offer URL',
              'idField'   : 'offer_url_id',
              'groupable' : true,
              'fields' : {
                'id'          : {'type' : 'integer'},
                'name'        : {'type' : 'string', 'nicename' : 'Offer URL'},
                'preview_url' : {'type' : 'string'},
                'offer_url'   : {'type' : 'string'}
              }
            },

            'Thumbnail' : {
              'nicename'  : 'Thumbnail',
              'groupable' : true,
              'fields' : {
                'id'        : {'type' : 'integer'},
                'display'   : {'type' : 'string'},
                'thumbnail' : {'type' : 'string'},
                'width'     : {'type' : 'string'},
                'height'    : {'type' : 'string'}
              }
            },

            'Stat' : {
              'idField'   : 'offer_id',
              'groupable' : false,
              'fields' : {
                'offer_id' : {'type' : 'integer'},
                'erpc'     : {'type' : 'currency', 'nicename' : 'EPC', 'defaultValue': '0.00'}
              }
            }
          }
        };
      }
    });
    return OffersModel;
  }];

  // scope to root
  root.Models.offers = OffersService;

})(this, jQuery);
