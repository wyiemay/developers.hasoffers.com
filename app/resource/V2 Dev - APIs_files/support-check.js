(function($){
  'use strict';

  var ver = function(str){
    return parseFloat(str);
  };

  var isBrowser = function(browser, version, UA) {
    var matches = [],
        matchesV = [],
        retVal = false;

    switch(browser) {
      case 'chrome':
        matches = UA.match(/Chrome\/([0-9\.]{1,})/);
        retVal = (matches && ver(matches[1]) >= version);
        break;

      case 'safari':
        matches = UA.match(/Safari/);
        matchesV = UA.match(/Version\/([0-9\.]{1,})/);
        retVal = (matches && matchesV && ver(matchesV[1]) >= version);
        break;

      case 'firefox':
        matches = UA.match(/Firefox\/([0-9\.]{1,})/);
        retVal = (matches && ver(matches[1]) >= version);
        break;

      case 'explorer':
        matches = UA.match(/MSIE ([0-9\.]{1,})/);
        retVal = (matches && ver(matches[1]) >= version);
        break;
    }

    return retVal;
  };

  var getOS = function (UA) {
    var matches, 
        retVal = false,
        vMatch = [],
        androidMatch = UA.match(/Android ([0-9\.]{1,});/),
        iosMatch = UA.match(/iPhone|iPad|iPod/);

    if (iosMatch) {

      vMatch = UA.match(/OS ([0-9_]{1,})/);

      retVal = {
        os: 'iOS',
        version: ver(vMatch[1].replace(/_/g, '.'))
      };

    } else if (androidMatch) {
      retVal = {
        os: 'Android',
        version: ver(androidMatch[1])
      };
    };

    return retVal;
  };

  /**
   * getBrowserSupportLevel
   *
   * Determine the level of support for the current User Agent or a passed User Agent
   *
   * Firefox 19+
   * Chrome 20+
   * IE9+ (Limited support) - Tier 2
   * iOS 4+ safari
   * Android 3+ webkit, (we currently have no way to test other devices.) 
   * 
   * tier 1 - supported
   * tier 2 - will probably work but not officially supported
   * tier 3 - not supported
   *
   * @param     {String}    UA               The User Agent sring - can be used with any User agent 
   *                                         string for testing purposes
   *                                         
   * @param     {String}    objectDetect     Set to false if you want to use only UA string to 
   *                                         determine compatibility, defaults to true;
   *                                         
   * @return    {Integer}                    The tier level of support for the given UA string
   */

  var getBrowserSupportLevel = window.getBrowserSupportLevel = function(UA, objectDetect) {
    UA = (UA && UA.constructor === String) ? UA : (navigator.userAgent || '');
    objectDetect = (objectDetect === false) ? objectDetect : true;

    var osMatch = getOS(UA);

    if(osMatch){ // this will work for now since we are only testing for IOS and android
      if(osMatch.os === 'Android' && osMatch.version > 3 || osMatch.os === 'iOS' && osMatch.version > 4) {
        return 1;
      }

      // if Match made and no version match fall through, still may have lower tier support
    } else if (isBrowser('chrome', 20, UA) || isBrowser('safari', 4, UA) ||
               isBrowser('firefox', 19, UA) || isBrowser('explorer', 9, UA)) {
      return 1;
    }

    if ('forEach' in [] && objectDetect) {
      return 2;
    }

    return 3;
  };

   /**
   * setBrowserSupportLevel
   *
   * Gets the Level Of support from getBrowserSupport Level based on arguments passed, then sets the HTML class
   * to supported, or partial-support if applicable, if fully supported no HTML class is added
   *
   * @param     {String}    UA               The User Agent sring - can be used with any User agent 
   *                                         string for testing purposes
   *                                         
   * @param     {String}    objectDetect     Set to false if you want to use only UA string to 
   *                                         determine compatibility, defaaults to false;
   */
  var setBrowserSupportLevel = window.setBrowserSupportLevel = function(UA, objectDetect) {
    var supportLevel = getBrowserSupportLevel(UA, objectDetect);

    $('html').removeClass('partial-support unsupported no-js');

    if (supportLevel === 2) {
      $('html').addClass('partial-support');
    }

    if (supportLevel === 3) {
      $('html').addClass('unsupported');
    }

    // on dismiss remove the class
    $('.support-alert').bind('closed', function() {
      $('html').removeClass('partial-support unsupported');
    });
  };

  // setup Page
  $(setBrowserSupportLevel);
})(jQuery);