/*
 * models base class
 */

(function(root, $, undefined) {
  'use strict';

  var modelBaseService = ['api', 'digestService', function(api, digestService) {
    var modelsBase = Class.extend({
      name : 'base',
      // common methods
      init : function() {
        //console.log('model:'+this.name);
      },

      /*
       * wraps promise and populates scope with results
       */
      populateScope : function(promise, $scope, property, isJson) {
        if (promise.success) {
          promise.success(function(data) {
            if (!isJson || _.isObject(data)) {
              $scope[property] = data;
            }
          });
        }
      },

      /*
       * processRequestsToScope handles multiple requests from controller
       * populates $scope with returned data
       */
      processRequestsToScope : function($scope, requests) {
        var $this = this;
        _.each(requests, function(req, prop) {
          $this[req]($scope, prop);
        });
      },

      /**
       * determines nicename from either definition or field name processed through Formatter.titleCaps
       * @param  {string} field      field name.
       * @param  {obj} definition definition list.
       * @return {string} nicename/label.
       */
      determineNicename : function(field, definition) {
        var fieldSplit = field.split('.'),
          name;

        if (fieldSplit.length > 1) {
          if (_.hasMembers(definition.related_entities, fieldSplit[0], 'fields', fieldSplit[1], 'nicename')) {
            name = definition.related_entities[fieldSplit[0]].fields[fieldSplit[1]].nicename;
          }
        } else if (definition.fields[field] && definition.fields[field].nicename) {
          name = definition.fields[field].nicename;
        } else if (_.hasMembers(definition, 'related_entities', field, 'nicename')) {
          name = definition.related_entities[field].nicename;
        }

        if (!name) {
          if (fieldSplit.length > 0) {
            if (fieldSplit[0] == 'Stat') {
              name = fieldSplit[1];
            } else {
              name = fieldSplit[0];
            }
          } else {
            name = field;
          }
          name = root.Formatter.titleCaps(name, true);
        }

        return name;
      },

      /**
       * container to hold cached getChoices api returns
       * @type {Object}
       */
      choiceCache: {},

      /**
       * translates api request to choice data format
       * @param  {object} $scope    angular scope object.
       * @param  {string} property  property to be set with returned data.
       * @param  {string} method    api method to retrieve data.
       * @param  {object} params    params to send to api.
       * @param  {object} param_map maps label, value from returned data.
       * @return {object}           promise.
       */
      getChoices: function($scope, property, method, params, param_map) {
        var fullUrl = api.generateURL(method, params),
          digest = digestService,
          urlHash = digest.md5(fullUrl),
          $this = this;

        // if this already exists
        if ($this.choiceCache[urlHash]) {
          $scope[property] = root.angular.copy($this.choiceCache[urlHash]);

          return {};
          // otherwise need to grab from api
        } else {
          var choiceRequest = api.get(method, params),
            choiceData = [];

          choiceRequest.success(function(dataReturn) {
            if (!_.isObject(dataReturn)) {
              throw new Error('Unable to determine choices for ' + property);
            }

            // process into choiceData array
            _.each(dataReturn, function(row) {
              if (param_map.entity && row[param_map.entity]) {
                row = row[param_map.entity];
              }
              var option = {
                'label' : '{0}{1}'.format(
                  param_map.label_prefix ? param_map.label_prefix : '', row[param_map.label]
                ),
                'value' : row[param_map.value]
              };
              choiceData.push(option);
            });

            choiceData.sort(function(a, b) {
              return a.label > b.label ? 1 : a.label < b.label ? -1 : 0;
            });


            // add default option
            if (param_map.default_choice) {
              choiceData.unshift(param_map.default_choice);
            }

            // set to cache
            $this.choiceCache[urlHash] = choiceData;
            $scope[property] = root.angular.copy($this.choiceCache[urlHash]);

          });
          return choiceRequest;
        }
      },

      /**
       * converts api parameter data_start and data_end to filter
       * @param {object} params api parameters.
       * @param {undefined||string} field field to use as filter, defaults to Stat.date.
       * @return {object} modified parameter object.
       */
      addDateFilter : function(params, field) {
        field = field || 'Stat.date';

        if (params.data_start && params.data_end) {
          params.filters = params.filters || {};
          params.filters[field] = {'conditional' : 'BETWEEN', 'values' : [params.data_start, params.data_end]};
        }
        return params;
      },

      /**
       * converts fields and filters to contains property of array
       * @param  {object} params api parameters.
       * @return {object}        converted parameters object.
       */
      convertContains : function(params) {
        if (params.contain) {
          var newContain = {};
          _.each(params.contain, function(entity) {
            var containObj = {'fields' : [], 'filters' : {}};
            params.fields = _.reject(params.fields, function(field) {
              if (field.split('.').shift() == entity) {
                containObj.fields.push(field);
                return true;
              }
              return false;
            });
            _.each(params.filters, function(filter, field) {
              if (field.split('.').shift() == entity) {
                containObj.filters[field] = filter;
                delete(params.filters[field]);
              }
            });
            newContain[entity] = containObj;
          });
          params.contain = newContain;
        }

        return params;
      },

      /**
       * standard field level definitions
       * @param  {string} fieldName name of field.
       * @return {object}           definition for that field.
       * @throws {stdErr} If fieldname doesn't exist
       */
      getStandardDef : function(fieldName) {
        var standardDefs = {
          'id'           : {'type' : 'integer', 'nicename' : 'ID'},
          'status'       : {'type' : 'enum', 'values' : {
            'active' : 'Active',
            'paused' : 'Paused',
            'deleted' : 'Deleted'
          }},
          'bool_yes'     : {'type' : 'boolean', 'values' : {0 : 'No', 1 : 'Yes'} },
          'bool_enabled' : {'type' : 'enum', 'values' : {1 : 'Enabled', 0 : 'Disabled'}},
          'created'      : {'type' : 'timestamp'},
          'modified'     : {'type' : 'timestamp'}
        };
        if (!standardDefs[fieldName]) {
          throw new Error('Could not determine standard fieldname: ' + fieldName);
        }
        return root.angular.copy(standardDefs[fieldName]);
      }
    });

    return modelsBase;
  }];

  //scope Models, Models.base to root
  root.Models = {};
  root.Models.base = modelBaseService;
})(this, jQuery);
