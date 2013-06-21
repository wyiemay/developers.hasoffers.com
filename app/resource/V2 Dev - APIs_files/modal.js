/* modal directives for AngularStrap */
/* More directives available at http://mgcrea.github.com/angular-strap/ */

(function(root, $, undefined) {
  'use strict';

  root.Application.directive('bsModal',
    [
      '$parse',
      '$compile',
      '$http',
      '$timeout',
      'garbageCollection',
      '$q',
      '$templateCache',
      'directiveRegistry',
      function($parse,
               $compile,
               $http,
               $timeout,
               garbageCollection,
               $q,
               $templateCache,
               directiveRegistry) {

        return {
          restrict: 'A',
          scope: true,
          link: function postLink(scope, element, attr) {
            var getter = $parse(attr.bsModal),
              value = getter(scope);

            $q.when($templateCache.get(value) || $http.get(value, {cache: true})).then(function onSuccess(template) {

              // Provide scope display functions
              scope.dismiss = function() {
                $modal.modal('hide');
                scope.$broadcast('modalHide');
              };

              var triggeredOnce = {};

              scope.show = function() {
                $modal.modal('show');
              };

              scope.onShow = function() {
                scope.$broadcast('modalShow');

                if (attr.triggerOnce && _.isUndefined(triggeredOnce[attr.triggerOnce]) &&
                  _.isFunction(scope[attr.triggerOnce])) {
                  triggeredOnce[attr.triggerOnce] = true;
                  scope[attr.triggerOnce]();
                }

                if (attr.triggerShow && _.isFunction(scope[attr.triggerShow])) {
                  scope[attr.triggerShow]();
                }
                // resize grid if necessary
                var grid = $modal.find('.jqgrid');
                if (grid.length > 0) {
                  // need to delay to allow modal to actually show
                  _.delay(function() {
                    grid.grid('resizeGrid');
                  }, 100);
                }
              };

              scope.onHide = function() {
                scope.$broadcast('modalHide');
                if (attr.triggerHide && _.isFunction(scope[attr.triggerHide])) {
                  scope[attr.triggerHide]();
                }
              };

              // Build modal object
              var id = getter(scope)
                .replace(/\//g, '-')
                .replace(/\./g, '-')
                .replace('html', scope.$id);

              garbageCollection.add('#' + id);
              var $modal = root.angular
                .element('<div class="modal-container"></div>')
                .attr('id', id)
                .addClass('modal hide fade')
                .html(template.data || template);

              root.angular.element('body').append($modal);

              // Configure element
              element.attr('href', '#' + id).attr('data-toggle', 'modal');
              if (attr.parentName) {
                scope.$parent[attr.parentName] = {
                  'show' : scope.show,
                  'hide' : scope.hide,
                  'scope' : scope
                };
              }

              if (attr.closeOn) {
                scope.$on(attr.closeOn, function() {
                  scope.dismiss();
                });
              }

              // Compile modal content
              $timeout(function() {
                $compile($modal)(scope);
                $modal.on('show', $.proxy(scope.onShow, scope));
                $modal.on('hide', $.proxy(scope.onHide, scope));
                directiveRegistry.register(scope, attr.parentName || id);
              });
            });
          }
        };
      }]);
})(this, jQuery);
