/* Event directives along with jqGrid */

(function(root, $, undefined) {
  'use strict';
  var zclipPath = 'js/vendor/zerocb/ZeroClipboard.swf';

  // handles focus events
  root.Application.directive('diZclip',
    function() {
      return function(scope, element, attrs) {
        element.zclip({
          path: zclipPath,
          copy: function(){
            if (attrs.model) {
              return scope[attrs.model] || '';
            } else if (attrs.copytarg) {
              return $('#' + attrs.copytarg).val();
            }
          },
          afterCopy: function() {
            element.tooltip('show');
            _.delay(function() {
              element.tooltip('hide');
            }, 4000);
          }
        });

        element.bind('hover', function() {
          element.zclip('reposition');
        });

        element.tooltip({
          'placement' : 'right',
          'title' : 'Copied to Clipboard',
          'trigger' : 'manual'
        });
      };
    }
  );

  // set ZeroClipboard path
  root['ZeroClipboard'].setMoviePath(zclipPath);

})(this, jQuery);
