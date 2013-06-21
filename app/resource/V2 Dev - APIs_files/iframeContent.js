/**
 * Sample:
 * <div iframe-content=VARIABLE></div>
 */


(function(root, $, undefined) {
  'use strict';

  root.Application.directive('iframeContent',
    ['directiveRegistry', '$window', function(directiveRegistry, $window) {
      return {
        'template'   : '<iframe />',
        'restrict'   : 'A',
        'transclude' : false,
        'scope' : {
          'content' : '=iframeContent'
        },
        'link' : function (scope, element, attrs) {
          var iFrameFullHeight = _.throttle(function() {
            // checking window.innerHeight fixes issue with incorrect window.height() on iOS
            var height = $window.innerHeight ? $window.innerHeight : $($window).height();

            // 100% height of window; fixes css issue in Firefox where you can't successfully set height: 100%
            element.find('iframe').height(height);
          }, 250);

          $($window).on('resize', iFrameFullHeight);

          scope.$on('$destroy', function() {
            element.remove();
            $($window).off('resize', iFrameFullHeight);
          });

          scope.$watch('content', function(content) {
            var iframe = element.find('iframe').get(0);

            if (iframe && content) {
              var doc = iframe.contentWindow.document;
              doc.open();
              doc.write(content);
              doc.write('<link rel="stylesheet" href="css/screen.css" />');
              doc.write('<style type="text/css">html, body {height: auto;}body {padding: 12px;}</style>');
              doc.close();

              iFrameFullHeight();
            }
          });

          if (attrs.name) {
            directiveRegistry.register(scope, attrs.name);
          }
        }
      };
    }]
  );

})(this, jQuery);
