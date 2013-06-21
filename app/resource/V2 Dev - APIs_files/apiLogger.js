(function(root, $, undefined) {
  'use strict';

  root.ApiLogger = function() {
    var callStats = {},
        requests = {};

    this.enabled = false;

    this.uid = 0;

    this.processCallStat = function(method, params) {
      params = params || {};
      callStats[method] = callStats[method] || {calls: 0, fields:[], filters:[], contain:[]};
      callStats[method].calls++;

      // Process params.fields
      if (params.fields) {
        callStats[method].fields = _.union(callStats[method].fields, params.fields);
      }

      // Process params.filters
      if (params.filters) {
        callStats[method].filters = _.union(callStats[method].filters, params.filters);
      }

      // Process params.contain
      if (params.contain) {
        callStats[method].contain.push(params.contain);
      }
    };

    this.logRequest = function(uid, payload) {
      if (!this.enabled) {
        return false;
      }

      requests[uid] = payload;
      this.processCallStat(payload.method, payload.params);
    };

    this.getRequests = _.throttle(function() {
      if (!this.enabled) {
        return {};
      }

      return _.chain(requests)
              .toArray()
              .sortBy(function sortRequests(r){return r.uid;})
              .value();
    }, 500);

    this.getCallStats = _.throttle(function() {
      if (!this.enabled) {
        return [];
      }

      return callStats;
    }, 500);

    this.dump = function() {
      var text = '"' + escape(JSON.stringify({callStats: callStats, requests: requests})) + '"';

      /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
      var saveAs=saveAs||navigator.msSaveBlob&&navigator.msSaveBlob.bind(navigator)||function(a){"use strict";var b=a.document,c=function(){return a.URL||a.webkitURL||a},d=a.URL||a.webkitURL||a,e=b.createElementNS("http://www.w3.org/1999/xhtml","a"),f="download"in e,g=function(c){var d=b.createEvent("MouseEvents");return d.initMouseEvent("click",!0,!1,a,0,0,0,0,0,!1,!1,!1,!1,0,null),c.dispatchEvent(d)},h=a.webkitRequestFileSystem,i=a.requestFileSystem||h||a.mozRequestFileSystem,j=function(b){(a.setImmediate||a.setTimeout)(function(){throw b},0)},k="application/octet-stream",l=0,m=[],n=function(){for(var a=m.length;a--;){var b=m[a];"string"==typeof b?d.revokeObjectURL(b):b.remove()}m.length=0},o=function(a,b,c){b=[].concat(b);for(var d=b.length;d--;){var e=a["on"+b[d]];if("function"==typeof e)try{e.call(a,c||a)}catch(f){j(f)}}},p=function(b,d){var q,r,x,j=this,n=b.type,p=!1,s=function(){var a=c().createObjectURL(b);return m.push(a),a},t=function(){o(j,"writestart progress write writeend".split(" "))},u=function(){(p||!q)&&(q=s(b)),r&&(r.location.href=q),j.readyState=j.DONE,t()},v=function(a){return function(){return j.readyState!==j.DONE?a.apply(this,arguments):void 0}},w={create:!0,exclusive:!1};return j.readyState=j.INIT,d||(d="download"),f&&(q=s(b),e.href=q,e.download=d,g(e))?(j.readyState=j.DONE,t(),void 0):(a.chrome&&n&&n!==k&&(x=b.slice||b.webkitSlice,b=x.call(b,0,b.size,k),p=!0),h&&"download"!==d&&(d+=".download"),r=n===k||h?a:a.open(),i?(l+=b.size,i(a.TEMPORARY,l,v(function(a){a.root.getDirectory("saved",w,v(function(a){var c=function(){a.getFile(d,w,v(function(a){a.createWriter(v(function(c){c.onwriteend=function(b){r.location.href=a.toURL(),m.push(a),j.readyState=j.DONE,o(j,"writeend",b)},c.onerror=function(){var a=c.error;a.code!==a.ABORT_ERR&&u()},"writestart progress write abort".split(" ").forEach(function(a){c["on"+a]=j["on"+a]}),c.write(b),j.abort=function(){c.abort(),j.readyState=j.DONE},j.readyState=j.WRITING}),u)}),u)};a.getFile(d,{create:!1},v(function(a){a.remove(),c()}),v(function(a){a.code===a.NOT_FOUND_ERR?c():u()}))}),u)}),u),void 0):(u(),void 0))},q=p.prototype,r=function(a,b){return new p(a,b)};return q.abort=function(){var a=this;a.readyState=a.DONE,o(a,"abort")},q.readyState=q.INIT=0,q.WRITING=1,q.DONE=2,q.error=q.onwritestart=q.onprogress=q.onwrite=q.onabort=q.onerror=q.onwriteend=null,a.addEventListener("unload",n,!1),r}(self);

        saveAs(
          new Blob([text], {type: "text/plain;charset=" + document.characterSet}),
          'debug-'+moment().format()+'.txt'
        );
    };

    this.loadDump = function(dump) {
      var importData = JSON.parse(unescape(dump));
      callStats = importData.callStats;
      requests = importData.requests;
    };
  };
})(this, jQuery);
