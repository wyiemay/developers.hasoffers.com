/**
 * registers directives for communication purposes.
 *
 */

(function (root) {
  'use strict';
  var app = root.angular.module('hasOffers.serviceLayer', []);

  app.service('directiveRegistry', ['$rootScope', function(rootScope) {
    var namespaces, registry;

    namespaces = {};
    registry = {};

    registry.register = function(scope, name) {
      if (namespaces[name]) {
        throw new Error('Scope with the name (' + name + ') already registered');
      }
      namespaces[name] = scope;
      scope.$on('$destroy', function() {
        delete namespaces[name];
      });
    };


    /**
     * Executes a callback when a complete list of directives are registered.
     * Times out after 2 seconds.
     *
     * @param directives {string|array} The name(s) of the directives to watch for.
     * @param fn {function} The callback to be executed when the directives are ready.
     * @param context {object?} The 'this' context used for the callback.
     */
    registry.onDirectivesReady = function(directives, fn, context) {
      if(!_.isArray(directives)) {
        directives = [directives];
      }

      var watcher = rootScope.$new(true);

      var found = {};
      setTimeout(function(){
        var foundKeys = _.keys(found);
        watcher.$destroy();
        if (foundKeys.length !== directives.length) {
          var diff = _.difference(directives, foundKeys);
          throw new Error('Timed out waiting for the following directives to register: ' + diff.join(', '));
        }
      }, 2000);

      watcher.$watch(
        function() {
          _.each(directives, function(directive) {
            if (registry.get(directive)) {
              found[directive] = true;
            }
          });

          var foundKeys = _.keys(found);
          return foundKeys.length === directives.length;
        },
        function(result) {
          if(result) {
            fn.call(context || undefined);
          }
        }
      );
    };

    registry.get = function(name) {
      return namespaces[name];
    };

    registry.purge = function(name) {
      delete namespaces[name];
    };

    return registry;
  }]);
})(this);
