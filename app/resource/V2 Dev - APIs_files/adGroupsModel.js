/*
 * offers model
 */

(function(root, $, undefined) {
  'use strict';

  var AdGroupService = ['api', 'models', function(api, models) {
  // create models class
    var AdGroupModel = models.getExtendable('base').extend({

      /**
       * Gets Adgroup performance data
       * @param  {object} params api request parameters.
       * @return {object}        angular promise object.
       */
      getAdGroupsPerformance : function(params) {
        params = this.addDateFilter(params);
        return api.get('Report/getStats', params);
      },

      /**
       * gets adgroup data
       * @param  {object} params api request parameters.
       * @return promise object.
       */
      getAdGroupData : function(params) {
        params = this.addDateFilter(params);
        params = this.convertContains(params);

        if (params.id) {
          return api.get('AdManager/findCampaignById', params);
        } else {
          return api.get('AdManager/findAllCampaigns', params);
        }
      },

      /**
       * gets creatives for chosen campaign
       * @param  {object} params api parameters.
       * @return {object}        api promise object.
       */
      getCreativeData : function(params) {

        params.id = params.filters.id;
        delete(params.filters.id);

        return api.get('AdManager/getCampaignCreatives', params);

      },

      /**
       * find creatives
       * @param  {object} params api parameters.
       * @return promise object.
       */
      findCreatives : function(params) {
        this.convertContains(params);
        return api.get('OfferFile/findAll', params);
      },

      /**
       * saves ad group data
       * @param  {object} params api parameters.
       * @return {object}        Api response.
       */
      saveAdGroup : function(params) {

        // if we're an existing adgroup, parse params and update campaign
        var requestParams = { 'data' : root.angular.copy(params) };
        if (params.id) {
          requestParams.id = params.id;
          _.each(['id', 'modified'], function(remove) {
            delete(requestParams.data[remove]);
          });
          return api.get('AdManager/updateCampaign', requestParams);

          // otherwise create campaign from different endpoint
        } else {

          // we assume user is an affilate for now
          requestParams.data['interface'] = 'affiliate';
          requestParams.data['account_id'] = root.Config.affiliate_id;

          return api.get('AdManager/createCampaign', requestParams);
        }
      },

      /**
       * adds creative to adgroup
       * @param {object} params api parameters.
       * @param {object} $q     angular deferred object.
       * @return {object}  $q style deferred object promise
       */
      addCreativeToAdgroup : function(params, $q) {

        // need to determine if creative already added, if so, simply update

        var findFilter = { 'filters' : root.angular.copy(params) },
          deferred = $q.defer();

        delete(findFilter.filters.offer_id); // not needed to find

        // determine if creative already exists for this adgroup
        api.get('AdManager/findAllCreatives', findFilter).success(function(creativesData) {
          if (_.size(creativesData) > 0 && _.isObject(_.first(_.values(creativesData)).AdCampaignCreative)) {
            // update existing creative, setting status to active
            var updateParams = {
              'id'    : _.first(_.values(creativesData)).AdCampaignCreative.id,
              'field' : 'status',
              'value' : 'active'
            };
            api.get('AdManager/updateCreativeField', updateParams).success(function(dataReturn) {
              deferred.resolve(dataReturn);
            });

          } else {
            // add new creative
            var addParams = {
              'campaign_id' : params.ad_campaign_id,
              'data'        : root.angular.copy(params)
            };

            delete(addParams.data.ad_campaign_id);
            api.get('AdManager/addCreative', addParams).success(function(dataReturn) {
              deferred.resolve(dataReturn);
            });
          }

        });

        return deferred.promise;
      },

      /**
       * updates weight of particular Creative
       * @param  {integer}   id     the ID for which creative to assign
       * @param  {number}    weight the weight to assign
       * @return {object}           angular promise object
       */
      updateCreativeWeight: function(id, weight){
        var params = {
          id    : id,
          field : 'custom_weight',
          value : weight
        }
        return api.get('AdManager/updateCreativeField', params);
      },

      /**
       * updates status of AdManager/CreateiveField
       * @param  {array} creatives list of creatives ids.
       * @param  {string} status    pending, active, etc.
       * @param  {object} $q        angular promise constructor.
       * @return {object}           angular promise object.
       */
      updateCreativesStatus : function(creatives, status, $q) {
        var deferred = $q.defer(),
          reqs = [],
          params = {'field' : 'status', 'value' : status};

        _.each(creatives, function(id) {
          params.id = id;
          reqs.push(api.get('AdManager/updateCreativeField', params));
        });

        $q.all(reqs).then(function() {
          deferred.resolve(arguments);
        });
        return deferred.promise;
      },

      /**
       * gets hostnames for dropdown
       * @return {object}       promise object.
       */
      getHostnames : function() {
        return api.get('Application/findAllHostnames', {'fields' : ['id', 'domain']});
      },

      /**
       * gets adgroup code from api
       * @param  {object} params api parameters.
       * @return {object}        angular promise object.
       */
      getAdgroupCode : function(params) {
        // append affiliate_id
        var requestParams = {
            'affiliate_id' : root.Config.affiliate_id,
            'campaign_id'  : params.id,
            'params'       : {}
          },
          map = {
            'format'    : 'format',
            'domain'    : 'hostNameId',
            'aff_sub'   : 'aff_sub',
            'aff_sub2'  : 'aff_sub2',
            'aff_sub3'  : 'aff_sub3',
            'aff_sub4'  : 'aff_sub4',
            'aff_sub5'  : 'aff_sub5',
            'source'    : 'source',
            'eredirect' : 'eredirect',
            'redirect'  : 'redirect'
          };

        _.each(map, function(paramKey, paramSource) {
          if (params[paramSource] && params[paramSource] !== '') {
            requestParams.params[paramKey] = params[paramSource];
          }
        });

        requestParams.options = requestParams.params;
        return api.get('AdManager/getCampaignCode', requestParams);
      },

      /**
       * returns adgroup entity definition
       * @return {object} definition meta data.
       */
      getAdgroupDefinition : function() {

        return {
          'entity'           : 'AdCampaign',
          'fields' : {
            'id'                 : this.getStandardDef('id'),
            'name'               : {'type' : 'string'},
            'type'               : {'type' : 'enum', 'values' : {'banner' : 'Banner', 'text' : 'Text'}},
            'height'             : {'type' : 'integer'},
            'width'              : {'type' : 'integer'},
            'interface'          : {'type' : 'enum', 'values' : {'affiliate' : 'Affiliate', 'network' : 'Network'}},
            'account_id'         : {'type' : 'integer'},
            'status'             : this.getStandardDef('status'),
            'custom_weights'     : this.getStandardDef('bool_enabled'),
            'affiliate_access'   : this.getStandardDef('bool_yes'),
            'optimization'       : this.getStandardDef('bool_enabled'),
            'optimization_field' : {'type' : 'enum', 'values' : {
              'ctr'    : 'Click through Rate (CTR)',
              'cr'     : 'Conversion Rate (CR)',
              'rpm'    : 'Revenue per Thousand Impressions (RPM)',
              'rpc'    : 'Revenue per Click (RPC)',
              'profit' : 'Profit'
            }},
            'modified'           : {'type' : 'timestamp'}
          },
          'related_entities' : {
            'Stat' : {
              'fields' : {
                'impressions' : {'type' : 'integer'},
                'clicks'      : {'type' : 'integer'},
                'ctr'         : {'type' : 'float', 'nicename' : 'CTR'},
                'conversions' : {'type' : 'integer'},
                'cpc'         : {'type' : 'string', 'nicename' : 'CPC'},
                'payout'      : {'type' : 'string'}
              }
            }
          },
          'custom_fields'    : {
            'serve_type' : {'random' : 'Randomly',
              'custom_weights'       : 'By Custom Weights',
              'optimize'             : 'By Optimization'}
          }
        };
      },

      /**
       * adgroup creatives definition list
       * @return {object} definition list.
       */
      getAdgroupCreativeDefinition : function() {
        return {
          'entity'           : 'AdCampaignCreative',
          'fields' : {
            'id'                    : this.getStandardDef('id'),
            'ad_campaign_id'        : {'type' : 'integer'},
            'offer_file_id'         : {'type' : 'integer'},
            'offer_id'              : {'type' : 'integer'},
            'offer_creative_url_id' : {'type' : 'integer'},
            'status'                : this.getStandardDef('status'),
            'weight'                : {'type' : 'integer'},
            'custom_weight'         : {'type' : 'integer'},
            'modified'              : this.getStandardDef('modified')
          },
          'related_entities' : {

            'OfferFile' : this.getOfferFileDefinition(),
            'Offer'     : this.getOfferDefinition(),
            'OfferUrl'  : this.getOfferUrlDefinition(),
            'Stat'      : {
              'fields' : {
                'impressions' : {'type' : 'integer'},
                'clicks'      : {'type' : 'integer'},
                'ctr'         : {'type' : 'float', 'nicename' : 'CTR'},
                'conversions' : {'type' : 'integer'},
                'cpc'         : {'type' : 'string', 'nicename' : 'CPC'},
                'payout'      : {'type' : 'string'}
              }
            }
          }
        };
      },

      /**
       * offerFile definition list
       * @return {object} definition list.
       */
      getOfferFileDefinition : function() {

        var definition = {
          'entity'    : 'OfferFile',
          'nicename'  : 'Offer File',
          'nameField' : 'display',
          'groupable' : true,
          'fields'    : {
            'id'                 : this.getStandardDef('id'),
            'offer_id'           : {'type' : 'integer'},
            'display'            : {'type' : 'string'},
            'filename'           : {'type' : 'string'},
            'thumbnail'          : {'type' : 'string'},
            'size'               : {'type' : 'string'},
            'status'             : this.getStandardDef('status'),
            'type'               : {'type' : 'string'},
            'width'              : {'type' : 'integer'},
            'height'             : {'type' : 'integer'},
            'code'               : {'type' : 'string'},
            'flash_vars'         : {'type' : 'string'},
            'creator_interface'  : {'type' : 'string'},
            'creator_account_id' : {'type' : 'integer'},
            'is_private'         : this.getStandardDef('bool_yes'),
            'created'            : this.getStandardDef('created'),
            'modified'           : this.getStandardDef('modified')
          },

          'related_entities' : {
            'Offer'    : this.getOfferDefinition(),
            'OfferUrl' : this.getOfferUrlDefinition()
          }
        };

        return root.angular.copy(definition);
      },

      /**
       * offer definition list
       * @return {object} definition list.
       */
      getOfferDefinition : function() {
        var definition = {
          'groupable' : true,
          'fields'    : {
            'id'   : this.getStandardDef('id'),
            'name' : {'type' : 'string'}
          }
        };

        return root.angular.copy(definition);
      },

      /**
       * offerUrl definition list
       * @return {object} definition list.
       */
      getOfferUrlDefinition : function() {
        var definition = {
          'groupable' : true,
          'fields'    : {
            'id'   : this.getStandardDef('id'),
            'name' : {'type' : 'string'}
          }
        };

        return root.angular.copy(definition);
      }
    });
    return AdGroupModel;
  }];

  // scope to root
  root.Models.adGroups = AdGroupService;

})(this, jQuery);
