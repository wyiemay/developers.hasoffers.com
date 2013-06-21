/*
 * ReportsDefinition model
 */

(function(root, $, undefined) {
  'use strict';


  var reportBaseService = ['api', 'models', 'currentUser', function(api, models, currentUser) {
    var offerModel = models.get('offers');
    var saleAmtPref;

    currentUser.checkPreference('affiliate_sale_amount', true).then(function(res) {
      saleAmtPref = res;
    });

    var reportBaseModel = models.getExtendable('base').extend({

      /**
       * Constructor to process various meta data
       * @return {void}
       */
      init : function() {
        var statsMoveToFront = ['Stat.offer_id'],
          conversionMoveToFront = ['Stat.datetime'];

        if (saleAmtPref) {
          this.statsReportsOptions[1].optionsList[1].push('Stat.sale_amount');
        }

        this.statsReportsOrder = _.union(
          statsMoveToFront,
          _.chain(this.statsReportsOptions)
            .clone()
            .pluck('optionsList')
            .flatten()
            .reject(function(col) { return _.indexOf(statsMoveToFront, col) > -1; })
            .value()
        );

        this.conversionReportsOrder = _.union(
          conversionMoveToFront,
          _.chain(this.conversionReportsOptions)
            .clone()
            .pluck('optionsList')
            .flatten()
            .reject(function(col) { return _.indexOf(conversionMoveToFront, col) > -1; })
            .value()
        );
      },

      /*
       * processes options fields to fieldname:value pairs for various option panels
       * @param optionsGroup
       * @param definition
       * @returns {object} processed options
       */
      processOptionsToSelectors : function(optionGroup, definition) {
        var $this = this;
        _.each(optionGroup, function(section, i) {
          optionGroup[i].options = _.map(section.optionsList, function(row) {
            var optRow = [];
            _.each(row, function(field) {
              optRow[optRow.length] = {'field' : field, 'label' : $this.determineNicename(field, definition)};
            });
            return optRow;
          });
        });
        return optionGroup;
      },

      /*
       * proceesses child-specific getOptions and getDefintions returns into angular-consumable options panel
       * @returns {object} processed options
       */
      getSelectorOptions : function() {
        return this.processOptionsToSelectors(
          this.getOptions(),
          this.getDefinition()
        );
      },

      /**
       * abstract method to return options
       * @return {object} child report's options meta data.
       */
      getOptions : function() {
        throw new Error('method \'getOptions\' must be declared in ' + this.name);
      },

      /**
       * abstract method to return definition object
       * @return {object} child report's definition meta data.
       */
      getDefinition : function() {
        throw new Error('method \'getDefinition\' must be declared in ' + this.name);
      },

      /**
      * determines 'name' field from given related entity
      * @param {string} entity related_entity name.
      * @return {string} entity.field representing the 'name' of the entity.
      */
      getNameField : function(entity) {
        var definition;

        definition = this.getDefinition();
        if (definition.related_entities &&
          definition.related_entities[entity] &&
          definition.related_entities[entity].nameField) {
          return definition.related_entities[entity].nameField;
        }
        return '{0}.name'.format(entity);
      },

      getIdField : function(entity) {
        var definition;

        definition = this.getDefinition();
        if (definition.related_entities &&
          definition.related_entities[entity] &&
          definition.related_entities[entity].idField) {
          return definition.related_entities[entity].idField;
        } else {
          return '{0}.id'.format(entity);
        }
      },

      /**
       * returns options for interval selector
       * assumes this is universal, overwrite in child if necessary
       * @return {array} array of field/label values.
       */
      getIntervalOptions : function() {
        return [
          {'field' : 'Stat.hour', 'label' : 'Hour of day'},
          {'field' : 'Stat.datehour', 'label' : 'Hour'},
          {'field' : 'Stat.date', 'label' : 'Day'},
          {'field' : 'Stat.week', 'label' : 'Week'},
          {'field' : 'Stat.month', 'label' : 'Month'},
          {'field' : 'Stat.year', 'label' : 'Year'}
        ];
      },

      generateReportDownload : function(method, start_date, end_date, report_params) {
        var params = {
          'method' : method,
          'start_date': start_date,
          'end_date' : end_date,
          'arguments' : report_params
        };

        return api.get('DownloadReport/getDownloadReportLink', params);
      },

      /**
       * polls api to get name for passed in entity.id,
       * populates scope.selectedFilters and triggers grid load
       * @param  {object} $scope       angular scope object.
       * @param  {object} $routeParams route parameters.
       * @return {void}
       */
      determineFiltersFromParam : function($scope, $routeParams) {
        var entityTitled = root.Formatter.titleCaps($routeParams.entity),
          entityNicename = this.determineNicename(entityTitled),
          fieldName = this.getNameField(entityTitled),
          dataPromise = api.get('{0}/findById'.format(entityTitled),
            { 'id' : $routeParams.id, 'fields' : ['id', 'name', fieldName]}),

          filterRow = _.find(this.reportFilterList, function(row) {
            return row.value == entityTitled;
          });

        dataPromise.success(function(returnData) {
          var labelFieldName = fieldName.split('.').pop();
          $scope.selectedFilters = [{
            'id'     : 0, // this is the array index
            'entity' : entityTitled,
            'field'  : filterRow.field ? filterRow.field : false,
            'value'  : $routeParams.id, // actual entity.id value
            'label'  : '{0}: {1}'.format(entityNicename, returnData[entityTitled][labelFieldName])
          }];

          // populate page title
          var lookupFieldName = fieldName;
          if (fieldName.indexOf('.') !== -1) {
            lookupFieldName = fieldName.split('.').pop();
          }
          $scope.pageTitle = $scope.pageTitle + ': {0} {1}'.format(
            entityNicename,
            returnData[entityTitled][lookupFieldName]
          );

          // simulate apply trigger on filter panel
          $scope.applyPanelFn('filters');
        });

      },

      /**
       * list of currency fields
       */
      currencyFields : root.Config.Enums.currencyFields,

      // list of available filters for all reports
      reportFilterList : [
        {
          'value'    : '',
          'label'    : 'Select filters to add',
          'dataCall' : undefined
        },
        {
          'value'    : 'Offer',
          'label'    : 'Filter: Offers',
          'dataCall' : $.proxy(offerModel.getOfferChoices, offerModel)
        },
        {
          'value'    : 'Goal',
          'label'    : 'Filter: Goals',
          'dataCall' : $.proxy(offerModel.getGoalChoices, offerModel)
        },
        {
          'value'    : 'Category',
          'field'    : 'Category.id',
          'label'    : 'Filter: Category',
          'dataCall' : $.proxy(offerModel.getCategoryChoices, offerModel)
        },
        {
          'value'    : 'OfferUrl',
          'field'    : 'Stat.offer_url_id',
          'label'    : 'Filter: Offer Urls',
          'dataCall' : $.proxy(offerModel.getOfferUrlChoices, offerModel)
        },
        {
          'value'    : 'OfferFile',
          'field'    : 'Stat.offer_file_id',
          'label'    : 'Filter: Offer Files',
          'dataCall' : $.proxy(offerModel.getOfferFileChoices, offerModel)
        },
        {
          'value'    : 'Country',
          'field'    : 'Country.code',
          'label'    : 'Filter: Countries',
          'dataCall' : $.proxy(offerModel.getCountryChoices, offerModel)
        },
        {
          'value'    : 'Sub ID 1',
          'field'    : 'Stat.affiliate_info1',
          'label'    : 'Filter: Sub ID 1',
          'dataCall' : null,
          'matchType': 'wild'
        },
        {
          'value'    : 'Sub ID 2',
          'field'    : 'Stat.affiliate_info2',
          'label'    : 'Filter: Sub ID 2',
          'dataCall' : null,
          'matchType': 'wild'
        },
        {
          'value'    : 'Sub ID 3',
          'field'    : 'Stat.affiliate_info3',
          'label'    : 'Filter: Sub ID 3',
          'dataCall' : null,
          'matchType': 'wild'
        },
        {
          'value'    : 'Sub ID 4',
          'field'    : 'Stat.affiliate_info4',
          'label'    : 'Filter: Sub ID 4',
          'dataCall' : null,
          'matchType': 'wild'
        },
        {
          'value'    : 'Sub ID 5',
          'field'    : 'Stat.affiliate_info5',
          'label'    : 'Filter: Sub ID 5',
          'dataCall' : null,
          'matchType': 'wild'
        },
        {
          'value'    : 'IP',
          'field'    : 'Stat.ip',
          'label'    : 'Filter: IP Address',
          'dataCall' : null,
          'matchType': 'wild'
        },
        {
          'value'    : 'Source',
          'field'    : 'Stat.source',
          'label'    : 'Filter: Source',
          'dataCall' : null,
          'matchType': 'wild'
        },
        {
          'value'    : 'Trans ID',
          'field'    : 'Stat.ad_id',
          'label'    : 'Filter: Transaction ID',
          'dataCall' : null,
          'matchType': 'exact'
        }

      ],

      // statReport meta data

      // list of filters available for statsReport
      statsReportFilterList : [
        '',
        'Offer',
        'Goal',
        'Category',
        'OfferUrl',
        'OfferFile',
        'Country',
        'Sub ID 1',
        'Sub ID 2',
        'Sub ID 3',
        'Sub ID 4',
        'Sub ID 5',
        'IP',
        'Trans ID',
        'Source'
      ],

      statsReportsOptions : [
        {
          'title'       : 'Select data to include:',
          'optionsList' : [
            [
              'Offer',
              'AdCampaign',
              'Goal',
              'Category',
              'OfferUrl',
              'OfferFile',
              'Country',
              'Browser',
              'Stat.source',
              'Stat.affiliate_info1',
              'Stat.affiliate_info2',
              'Stat.affiliate_info3',
              'Stat.affiliate_info4',
              'Stat.affiliate_info5'
            ]
          ]
        },
        {
          'title'       : 'Select statistics to include:',
          'optionsList' : [
            ['Stat.impressions', 'Stat.clicks', 'Stat.conversions'],
            ['Stat.payout', 'Stat.currency', 'Stat.revenue_type', 'Stat.date']
          ]
        },
        {

          'title'       : 'Select calculations to include',
          'optionsList' : [
            [
              'Stat.ctr', 'Stat.ltr',
              'Stat.cpc', 'Stat.cpm', 'Stat.cpa',
              'Stat.cpl', 'Stat.erpc'
            ]
          ]
        }
      ],

      statsReportsDefaultReport : {
        'fields' : [
          'Offer', 'Stat.impressions',
          'Stat.clicks', 'Stat.conversions',
          'Stat.payout', 'Stat.date', 'Stat.ctr', 'Stat.ltr'
        ],
        'chartType'       : 'line',
        'intervalType'    : 'Stat.date',
        'rowCount'        : '3',
        'selectedMetrics' : ['Stat.conversions'],
        'defaultSort'     : 'Stat.conversions desc'
      },

      statsReportsOrder : [],

      statReportDefinitions : {
        'singleFieldGroups' : [
          'Stat.source',
          'Stat.affiliate_info1',
          'Stat.affiliate_info2',
          'Stat.affiliate_info3',
          'Stat.affiliate_info4',
          'Stat.affiliate_info5'
        ],
        'fields' : {
          'currency'     : {'type' : 'string'},
          'payout_type'  : {'type' : 'string'},
          'revenue_type' : {'type' : 'string', 'nicename' : 'Payout Type'}
        },
        'related_entities' : {
          'Stat' : {
            'groupable' : false,
            'fields'    : {
              'count'                : {'type' : 'integer'},
              'affiliate_count'      : {'type' : 'integer'},
              'offer_count'          : {'type' : 'integer'},
              'impressions'          : {'type' : 'integer'},
              'clicks'               : {'type' : 'integer'},
              'ctr'                  : {'type' : 'percent', 'nicename' : 'CTR'},
              'conversions'          : {'type' : 'integer'},
              'ltr'                  : {'type' : 'percent', 'nicename' : 'LTR'},
              'goal_id'              : {'type' : 'integer'},
              'payout'               : {'type' : 'currency'},
              'erpc'                 : {'type' : 'currency', 'nicename' : 'EPC'},
              'cpc'                  : {'type' : 'currency', 'nicename' : 'CPC'},
              'cpm'                  : {'type' : 'currency', 'nicename' : 'CPM'},
              'cpa'                  : {'type' : 'currency', 'nicename' : 'CPA'},
              'cpl'                  : {'type' : 'currency', 'nicename' : 'CPL'},
              'sale_amount'          : {'type' : 'currency'},
              'affiliate_info1'      : {'nicename' : 'Sub ID', 'type' : 'string'},
              'affiliate_info2'      : {'type' : 'string', 'nicename' : 'Sub ID 2'},
              'affiliate_info3'      : {'type' : 'string', 'nicename' : 'Sub ID 3'},
              'affiliate_info4'      : {'type' : 'string', 'nicename' : 'Sub ID 4'},
              'affiliate_info5'      : {'type' : 'string', 'nicename' : 'Sub ID 5'},
              'year'                 : {'type' : 'integer', 'nicename' : 'Interval: Year'},
              'month'                : {'type' : 'integer', 'nicename' : 'Interval: Month'},
              'week'                 : {'type' : 'string', 'nicename' : 'Interval: Week'},
              'date'                 : {'type' : 'date'},
              'datehour'             : {'type' : 'date', 'nicename' : 'Interval: Hour'},
              'hour'                 : {'type' : 'integer', 'nicename' : 'Interval: Hour of Day'},
              'affiliate_id'         : {'type' : 'integer'},
              'offer_id'             : {'type' : 'integer'},
              'offer_url_id'         : {'type' : 'integer'},
              'offer_file_id'        : {'type' : 'integer'},
              'ad_campaign_id'       : {'type' : 'integer'},
              'country_code'         : {'type' : 'string'},
              'browser_id'           : {'type' : 'integer'},
              'source'               : {'type' : 'string'},
              'currency'             : {'type' : 'string'},
              'ip'                   : {'type' : 'string', 'nicename' : 'IP'}
            }
          },

          'Goal' : {
            'groupable' : true,
            'idField'   : 'Goal.name',
            'fields' : {
              'id'   : {'type' : 'integer'},
              'name' : {'type' : 'string'}
            }
          },
          'Offer' : {
            'groupable' : true,
            'idField'   : 'Stat.offer_id',
            'fields' : {
              'id'                 : {'type' : 'integer'},
              'name'               : {'type' : 'string'},
              'display_advertiser' : {'type' : 'boolean'},
              'shared_type'        : {'type' : 'string'}
            }
          },

          'Category' : {
            'groupable' : true,
            'idField'   : 'Category.name',
            'fields' : {
              'id'   : {'type' : 'integer'},
              'name' : {'type' : 'string'}
            }
          },

          'OfferUrl' : {
            'nicename'  : 'Offer URL',
            'idField'   : 'Stat.offer_url_id',
            'groupable' : true,
            'fields' : {
              'id'          : {'type' : 'integer'},
              'name'        : {'type' : 'string', 'nicename' : 'Offer URL'},
              'preview_url' : {'type' : 'string'}
            }
          },

          'OfferFile' : {
            'nameField' : 'OfferFile.display',
            'nicename'  : 'Creative',
            'idField'   : 'Stat.offer_file_id',
            'groupable' : true,
            'fields' : {
              'id'      : {'type' : 'integer'},
              'display' : {'type' : 'string', 'nicename' : 'Offer File'}
            }
          },

          'AdCampaign' : {
            'idField'   : 'Stat.ad_campaign_id',
            'nicename'  : 'Ad Group',
            'groupable' : true,
            'fields' : {
              'id'   : {'type' : 'integer'},
              'name' : {'type' : 'string', 'nicename' : 'Ad Group'}
            }
          },

          'Country' : {
            'groupable' : true,
            'idField'   : 'Country.name',
            'nameField' : 'Country.name',
            'fields' : {
              'code' : {'type' : 'string'},
              'name' : {'type' : 'string'}
            }
          },

          'Browser' : {
            'nameField' : 'Browser.display_name',
            'idField'   : 'Browser.display_name',
            'groupable' : true,
            'fields' : {
              'id'           : {'type' : 'integer'},
              'display_name' : {'type' : 'string'}
            }
          }
        }
      },

      // conversion report options

      conversionReportFilterList : [
        '',
        'Offer',
        'Goal',
        'Category',
        'Country',
        'Sub ID 1',
        'Sub ID 2',
        'Sub ID 3',
        'Sub ID 4',
        'Sub ID 5',
        'IP',
        'Trans ID',
        'Source'
      ],

      conversionReportsOptions : [
        {
          'title' : 'Include:',
          'optionsList' : [
            ['Offer', 'Goal', 'Country', 'Browser']
          ]
        },
        {
          'title' : 'Data:',
          'optionsList' : [
            ['Stat.conversion_status', 'Stat.payout', 'Stat.conversion_sale_amount'],
            ['Stat.ip', 'Stat.ad_id', 'Stat.datetime', 'Stat.source'],
            ['Stat.affiliate_info1', 'Stat.affiliate_info2', 'Stat.affiliate_info3',
              'Stat.affiliate_info4', 'Stat.affiliate_info5']
          ]
        }
      ],

      conversionReportsDefaultReport : {
        'fields' : ['Stat.ad_id', 'Offer', 'Stat.datetime', 'Stat.conversion_status', 'Stat.payout',
          'Stat.ip', 'Stat.affiliate_info1'
        ],
        'defaultSort' : 'Stat.datetime desc'
      },

      conversionReportsOrder : [],

      conversionReportDefinition : {
        'fields' : {
          'currency' : {'type' : 'string'}
        },
        'related_entities' : {
          'Stat' : {
            'groupable' : false,
            'fields' : {
              'conversion_id'          : {'type' : 'integer', 'nicename' : 'ID'},
              'ip'                     : {'type' : 'string', 'width' : 100, 'nicename' : 'Conversion IP'},
              'ad_id'                  : {'nicename' : 'Transaction ID', 'type' : 'string', 'width' : 130},
              'source'                 : {'type' : 'string'},
              'affiliate_info1'        : {'nicename' : 'Sub ID', 'type' : 'string', 'width' : 130},
              'affiliate_info2'        : {'type' : 'string', 'nicename': 'Sub ID 2'},
              'affiliate_info3'        : {'type' : 'string', 'nicename': 'Sub ID 3'},
              'affiliate_info4'        : {'type' : 'string', 'nicename': 'Sub ID 4'},
              'affiliate_info5'        : {'type' : 'string', 'nicename': 'Sub ID 5'},
              'conversion_status'      : {'nicename' : 'State', 'type' : 'string'},
              'goal_id'                : {'type' : 'integer'},
              'conversion_payout'      : {'nicename' : 'Payout', 'type' : 'currency'},
              'payout'                 : {'type' : 'currency'},
              'conversion_sale_amount' : {'nicename' : 'Sale Amount', 'type' : 'currency'},
              'datetime'               : {'type' : 'timestamp', 'nicename' : 'Time'},
              'date'                   : {'type' : 'date'},
              'offer_id'               : {'type' : 'integer'},
              'country_code'           : {'type' : 'string'}
            }
          },
          'Goal' : {
            'groupable' : false,
            'fields' : {
              'id'   : {'type' : 'integer'},
              'name' : {'type' : 'string'}
            }
          },
          'Offer' : {
            'groupable' : false,
            'idField'   : 'Stat.offer_id',
            'fields' : {
              'id'          : {'type' : 'integer'},
              'name'        : {'type' : 'integer', 'width' : 115},
              'shared_type' : {'type' : 'string'}
            }
          },
          'Country' : {
            'groupable' : false,
            'idField' : 'Country.name',
            'fields' : {
              'code' : {'type' : 'string'},
              'name' : {'type' : 'string'}
            }
          },
          'Browser' : {
            'nameField' : 'Browser.display_name',
            'idField'   : 'Browser.display_name',
            'groupable' : false,
            'fields' : {
              'id'           : {'type' : 'integer'},
              'display_name' : {'type' : 'string'}
            }
          }
        }
      },

      subscriptionDefinition : {
        'fields' : {},
        'related_entities' : {
          'Stat' : {
            'fields' : {
              'status'               : {'type' : 'string'},
              'created'              : {'type' : 'timestamp'},
              'start_date'           : {'type' : 'date'},
              'end_date'             : {'type' : 'date'},
              'payout'               : {'type' : 'currency'},
              'revenue'              : {'type' : 'currency'},
              'sale_amount'          : {'type' : 'currency'},
              'source'               : {'type' : 'string'},
              'affiliate_info1'      : {'type' : 'string'},
              'affiliate_info2'      : {'type' : 'string'},
              'affiliate_info3'      : {'type' : 'string'},
              'affiliate_info4'      : {'type' : 'string'},
              'affiliate_info5'      : {'type' : 'string'},
              'advertiser_info'      : {'type' : 'string'},
              'refer'                : {'type' : 'string'},
              'pixel_refer'          : {'type' : 'string'},
              'provided_id'          : {'type' : 'string'},
              'customer_list_id'     : {'type' : 'integer'},
              'affiliate_id'         : {'type' : 'integer'},
              'affiliate_manager_id' : {'type' : 'integer'},
              'offer_id'             : {'type' : 'integer'}
            }
          },
          'CustomerList' : {
            'fields' : {
              'id'   : {'type' : 'integer'},
              'name' : {'type' : 'string'}
            }
          },
          'Affiliate' : {
            'fields' : {
              'id'      : {'type' : 'integer'},
              'company' : {'type' : 'string'}

            }
          },
          'AffiliateManager' : {
            'niceName' : 'Affiliate Manager',
            'fields' : {
              'id'        : {'type' : 'integer'},
              'full_name' : {'type' : 'string'}
            }
          },
          'Offer' : {
            'fields' : {
              'id'   : {'type' : 'integer'},
              'name' : {'type' : 'string'}
            }
          }
        }
      }
    });

    return reportBaseModel;
  }];
  // scope to root, not intended to be instantiated directly
  root.Models.reportsBase = reportBaseService;

})(this, jQuery);
