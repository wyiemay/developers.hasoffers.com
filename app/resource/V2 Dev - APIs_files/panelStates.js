/**
 * handles panel states for various pages
 * panel sets are namespaced, and only allow one panel
 * per namespace open at a time
 *
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.directive('panelStates',
    ['$timeout', 'directiveRegistry', function($timeout, directiveRegistry) {
      return function(scope, element, attrs) {

        scope.panelObj = {
          panelOpen: {},
          panelElement: {},
          searchBox: {},
          hoverState: {},
          hoverPanel: {},
          hoverPanelOn: {},
          setupNamespace: function(ns) {
            var $this = this;
            ns = ns || 'default';
            _.each(['panelOpen', 'panelElement', 'searchBox'], function(prop) {
              if (_.isUndefined($this[prop][ns])) {
                $this[prop][ns] = null;
              }
            });
            return ns;
          }
        };

        scope.preventTouchScrolling = function(e) { 
           if ($(e.srcElement).parents('.panel-container').length == 0) {
            e.preventDefault(); 
          } else {
            e.stopPropagation();
          }
        }

        scope.disableMainPage = function() {
          $('html, body')
            .addClass('scroll-disabled')
            .on('touchstart touchmove', scope.preventTouchScrolling);
        }

        scope.enableMainPage = function() {
          $('html, body')
            .removeClass('scroll-disabled')
            .off('touchstart touchmove', scope.preventTouchScrolling);
        }

        scope.$parent.toggleHoverPanel =
          scope.toggleHoverPanel = function(e, panel, ns) {
            
            if (scope.isMobile) {
              scope.togglePanel(e, panel, ns);
              return;
            }

            ns = scope.panelObj.setupNamespace(ns);
            scope.panelObj.hoverPanelOn[ns] =
              scope.panelObj.hoverPanelOn[ns] == panel ? null : panel;

            if (scope.panelObj.hoverState[ns]) {
              $timeout.cancel(scope.panelObj.hoverState[ns]);
              scope.panelObj.hoverState[ns] = null;
              scope.panelObj.hoverPanel[ns] = null;
              scope.togglePanel(null, panel, ns);
            }
          };

        scope.$parent.hoverPanel = scope.hoverPanel = function(e, panel, ns) {

          // prevent hovers on mobile
          if (scope.isMobile) {
            return;
          }

          ns = scope.panelObj.setupNamespace(ns);

          // cancel existing hover timeout if necessary
          if (scope.panelObj.hoverState[ns]) {
            $timeout.cancel(scope.panelObj.hoverState[ns]);
            scope.panelObj.hoverState[ns] = null;
            scope.panelObj.hoverPanel[ns] = null;
          }

          if (e.type == 'mouseenter') {
            // if the panel is not already open prepare to hover
            if (scope.panelObj.panelOpen[ns] != panel &&
                  panel != 'panel-display') {
              scope.panelObj.hoverState[ns] = $timeout(function() {
                scope.togglePanel(null, panel, ns);
                scope.panelObj.hoverState[ns] = null;
                scope.panelObj.hoverPanel[ns] = null;
                scope.panelObj.hoverPanelOn[ns] = null;
              }, 350);
            }
          } else {
            // if panel isn't toggled on
            if (scope.panelObj.hoverPanelOn[ns] === null ||
                scope.panelObj.hoverPanelOn[ns] != panel &&
                panel != 'panel-display') {

              scope.panelObj.hoverState[ns] = $timeout(function() {

                // if there is a toggled-on panel, go back to it
                if (scope.panelObj.hoverPanelOn[ns]) {
                  scope.togglePanel(null, scope.panelObj.hoverPanelOn[ns], ns);
                } else {
                // otherwise turn off current panel
                  scope.togglePanel(null, scope.panelObj.panelOpen[ns], ns);
                }
                scope.panelObj.hoverState[ns] = null;
                scope.panelObj.hoverPanel[ns] = null;
              }, 350);
            }
          }
        };

        scope.$parent.togglePanel = scope.togglePanel = function(e, panel, ns) {
          ns = scope.panelObj.setupNamespace(ns);

          if (scope.panelObj.panelOpen[ns]) {
            scope.panelObj.panelElement[ns].hide('fast');
          }

          // mobile and taskbar check
          if (scope.isMobile && _.isObject(e) && $(e.currentTarget).parents('.taskbar').length > 0) {
            if (scope.panelObj.panelOpen[ns] == panel) {
              scope.enableMainPage();
            } else {
              scope.disableMainPage();
            }
          }

          if (scope.panelObj.panelOpen[ns] == panel) {
            scope.panelObj.panelOpen[ns] = null;
          } else {
            scope.panelObj.panelOpen[ns] = panel;
            scope.panelObj.panelElement[ns] = $('.panel.' + panel);
            scope.panelObj.panelElement[ns].slideDown();
          }

          if (_.isFunction(scope.togglePanelFn)) {
            scope.togglePanelFn(panel,
              _.isNull(scope.panelObj.panelOpen[ns], ns), ns);
          }
        };

        scope.$parent.cancelPanel = scope.cancelPanel = function(e, ns) {
          ns = scope.panelObj.setupNamespace(ns);
          e.preventDefault();
          var panel = scope.panelObj.panelOpen[ns];

          if (panel) {
            scope.togglePanel(e, panel, ns);
          }

          if (_.isFunction(scope.togglePanelFn)) {
            scope.togglePanelFn(panel, true, ns);
          }
        };

        scope.$parent.applyPanel = scope.applyPanel = function(e, ns) {
          ns = scope.panelObj.setupNamespace(ns);
          e.preventDefault();
          if (scope.panelObj.panelOpen[ns])
          {
            var panel = scope.panelObj.panelOpen[ns];
            if (_.isFunction(scope.applyPanelFn)) {
              scope.applyPanelFn(panel);
            }
          }
          scope.togglePanel(e, scope.panelObj.panelOpen[ns], ns);
        };

        scope.$parent.getPanelClass =
          scope.getPanelClass = function(panel, ns) {
            ns = scope.panelObj.setupNamespace(ns);
            return (scope.panelObj.panelOpen[ns] == panel ||
              scope.panelObj.searchBox[ns] == panel) ? 'on' : '';
          };

        // pass panelStates into scope.directivesReady
        scope.directivesReady = scope.directivesReady || [];
        scope.directivesReady.push('panelStates');
        directiveRegistry.register(scope, attrs.name || 'panelStates');

      };
    }]
  );

})(this, jQuery);
