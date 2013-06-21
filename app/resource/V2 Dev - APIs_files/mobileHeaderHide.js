(function(root, $, undefined) {
  'use strict';

  root.Application.directive('mobileHeaderHide', function() {

    return {
      'restrict'    : 'A',
      'link'        : function(scope, element) {

        var inputSelector = 'input:not(:checkbox, :radio), textarea, select';

        var $getHideElem = function() {
          return element.find('header.mobile .bar');
        };

        var handleFocus = function() {
          $getHideElem().css({position: 'absolute'});
        };

        var handleBlur = function() {
          $getHideElem().css({position: ''});
        };

        if (scope.isMobile) {
          element
            .on('focus', inputSelector, handleFocus)
            .on('blur', inputSelector, handleBlur);
        } else {
          // remove bound events if previously bound
          element
            .off('focus', inputSelector, handleFocus)
            .off('blur', inputSelector, handleBlur);
        }
      }
    };
  });
})(this, jQuery);