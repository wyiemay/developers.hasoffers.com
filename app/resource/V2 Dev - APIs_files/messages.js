/*
 * messages model
 */

(function(root, $, undefined) {
  'use strict';

  var MessageService = ['api', 'models', 'cache', '$q', function(api, models, cache, $q) {

    var MessagesModel = models.getExtendable('base').extend({

      name: 'messages',

      init: function() {
        this._super();
      },

      /**
       * return JS date object with local time set 
       * 
       * @param {str} datestring without timezone specified
       * @return {object} Date Object with local time
       */
      convertLocalTime: function(str) {
        var helper = root.ChartFactory.getHelper(),
            jsDate = helper.mySqlDateTime(str),

            // get time in milliseconds than add the inverse of the 
            // timezoneOffset (in minutes by default) and convert to milliseconds
            newDate = new Date(jsDate.getTime() + (jsDate.getTimezoneOffset() * -1 * 60 * 1000));
        return newDate;
      },

      /**
       * Get a single message
       * Will return from cache if the messages cache exists,
       * otherwise it will get message from the API
       * sets `$scope.message` to the message object requested
       * @param {int} id Id to look up.
       * @param {object} $scope angular $scope.
       */
      getMessage: function(id, $scope) {

        var model = this,
          messages = cache.get(this.name, 'messages', 3600),
          message = null;

        if (!_.isEmpty(messages)) {
          message = _.find(messages, function(current) {
            return current.Alert.id == id;
          });
        }

        if (_.isObject(message)) {
          $scope.message = message;
        } else {
          var promise = api.get('Alert/findById', {id: id});
          promise.success(function(response) {

            // convert datetime
            response.Alert.datetime = model.convertLocalTime(response.Alert.datetime);
            $scope.message = response;
          });
        }
      },

      /**
       * Get the count of un-dismissed messages
       * sets `$scope.messageCount` to the count of un-dismissed messages
       *
       * @param {object} $scope angular $scope.
       * @param {int}    max_age max age of cache hit.
       */
      getMessageCount: function($scope, max_age) {
        if (_.isUndefined(max_age)) {
          max_age = 60;
        }

        var messages = cache.get(this.name, 'messages', max_age);

        if (!_.isNull(messages)) {
          $scope.messageCount = _.size(messages);
        } else {
          var promise = this.getMessages({});
          promise.then(function(data) {
            if (_.isObject(data)) {
              $scope.messageCount = _.size(data);
            } else {
              $scope.messageCount = 0;
            }
          }, root.angular.noop);
        }
      },

      /**
       * Gets Messages data
       * @param {object} params api parameters to request.
       * @return {Object} Promise object.
       */
      getMessages: function(params) {
        params = $.extend(params, {
            'affiliate_user_id' : root.Config.affiliate_user_id,
            'is_dismissed'      : '0',
            'limit'             : 999999
          }
        );
        var messages = api.get('Alert/getAffiliateUserAlerts', params),
            name = this.name,
            deferred = $q.defer(),
            model = this;

        messages.success(function(data) {
          var sorted =
            _.chain(data)
              .toArray()
              .sortBy(function(r) {return parseInt(r.Alert.id, 10);})
              .value()
              .reverse();

          // convert datetime    
          _(sorted).each(function(member) {
            member.Alert.datetime = model.convertLocalTime(member.Alert.datetime);
          });

          cache.put(name, 'messages', root.angular.copy(sorted));
          deferred.resolve(sorted);
        });

        return deferred.promise;
      },

      /**
       * API call to 'dismiss' a message aka delete it
       * @param {array} params additional API params.
       * @return {object} Promise object.
       */
      dismissMessage: function(params) {
        params = $.extend(params, {'affiliate_user_id': root.Config.affiliate_user_id});
        return api.get('Alert/dismissAffiliateUserAlert', params);
      },

      /**
       * returns Alert entity definition
       * @see http://www.hasoffers.com/wiki/Api_Model:Alert
       * @return {object} definition meta data.
       */
      getDefinition: function() {
        return {
          'entity': 'Alert',
          'fields': {
            'id'               : {'type': 'integer'},
            'title'            : {'type': 'string'},
            'description'      : {'type': 'string'},
            'content'          : {'type': 'string'},
            'status'           : {'type': 'enum', 'values': {'active': 'Active', 'deleted': 'Deleted'}},
            'datetime'         : {'type': 'daterelative'},
            'type_code'        : {'type': 'integer'},
            'employee_id'      : {'type': 'integer'},
            'data'             : {'type': 'text'},
            'ref_affiliate_id' : {'type': 'integer'},
            'ref_key'          : {'type': 'string'},
            'ref_id'           : {'type': 'integer'}
          },
          'related_entities': {
            'AffiliateUserAlert': {
              'fields': {
                'id'                : {'type': 'integer'},
                'affiliate_user_id' : {'type': 'integer'},
                'alert_id'          : {'type': 'integer'},
                'is_dismissed'      : {'type': 'enum', 'values': {0: false, 1: true}}
              }
            }
          }
        };
      }
    });
    return MessagesModel;
  }];

  // scope to root
  root.Models.messages = MessageService;
})(this, jQuery);
