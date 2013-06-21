/*
 * Api handles communication between the client and the api server.
 */

(function(root, $, undefined) {
  'use strict';

  var Api = function($http, $timeout) {
    return {
      /**
       * @param  string  method     API Method.
       * @param  object  params     object of params to send to API call.
       * @return promise.
       */
      get: function(method, params) {
        var url, promise, logPayload, sendUrl;
        var $this = this;

        sendUrl = url = root.Api.generateURL(method, params);
        if (root.Config.proxy_url && root.Config.proxyEnabled && root.Config.proxyBucket) {
          sendUrl = root.Config.proxy_url + root.Config.proxyBucket + '/' +  encodeURIComponent(url);
        }
        promise = $http.jsonp(sendUrl);
        logPayload = {
          method   : method,
          url      : url,
          params   : JSON.stringify(params, null, 2),
          status   : '',
          data     : {},
          time     : moment().format('h:mm:ss'),
          duration : moment(),
          uid      : $this.logger.uid++
        };

        $this.logRequest(logPayload, 'progress', {});

        promise.then(function(data) {
          $this.logRequest(logPayload, 'success', JSON.stringify(data, null, 2));
        }, function(data) {
          $this.logRequest(logPayload, 'error', JSON.stringify(data, null, 2));
        });

        return promise;
      },

      logRequest : function(payload, status, data) {
        payload = _.clone(payload);
        payload.status = status;
        payload.data = data;
        payload.duration = (-1 * payload.duration.diff());
        var $this = this;

        $timeout(function(){
          $this.logger.logRequest(payload.uid, payload);
        });
      },

      generateURL: function(method, params) {
        var parts = method.split('/'),
            uri = root.Config.api_endpoint;

        if (parts.length !== 2) {
          throw new Error('Invalid API method ' + method);
        }

        params = params || {};
        params.Method = parts[1];
        params.NetworkId = root.Config.api_network_id;
        params.SessionToken = root.Config.session_token;
        params.callback = 'JSON_CALLBACK';

        uri += 'Affiliate_' + parts[0] + '.jsonp';

        if (params) {
          params = this.filterParams(params);
          if (_.size(params) > 0) {
            uri += '?' + $.param(params);
          }
        }

        return uri;
      },

      filterParams: function(params) {
        var ret = {};
        _.each(params, function(param, k) {
          if ((param || param === 0) && !_.isFunction(param)) {
            ret[k] = param;
          }
        });
        return ret;
      },

      logger: new root.ApiLogger()
    };
  };

  root.Application.service('api', ['$http', '$timeout', function($http, $timeout) {
    return root.Api = new Api($http, $timeout);
  }]);

})(this, jQuery);
