'use strict';

// Nunjucks specific functions. This module is currently not in use.

function createForBuild(build) {
  var exports = {};
  
  function cssFrom(srcPath) {
    /*jshint validthis: true */
    var ml = build.cssFrom(srcPath);
    return this.markSafe(ml);
  }
  exports.cssFrom = cssFrom;
  
  function jsCode(js) {
    /*jshint validthis: true */
    var ml = '<script type="text/javascript">' + js + '</script>';
    return this.markSafe(ml);
  }
  exports.jsCode = jsCode;
  
  function jsFrom(srcPath) {
    /*jshint validthis: true */
    var ml = build.jsFrom(srcPath);
    return this.markSafe(ml);
  }
  exports.jsFrom = jsFrom;

  exports.t = build.translate.bind(build);
  exports.tn = build.translateNumeric.bind(build);

  return exports;
}
exports.createForBuild = createForBuild;
