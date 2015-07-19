'use strict';

function createForBuild(build) {
  var exports = {};

  exports.t = build.translate;
  exports.tn = build.translateNumeric;
  
  function scriptJs(js) {
    /*jshint validthis: true */
    var ml = '<script type="text/javascript">' + js + '</script>';
    return this.markSafe(ml);
  }
  exports.scriptJs = scriptJs;
  
  function cssFile(srcpath) {
    /*jshint validthis: true */
    var ml = build.cssFile(srcpath);
    return this.markSafe(ml);
  }
  exports.cssFile = cssFile;
  
  function jsFile(srcpath) {
    var ml = build.jsFile(srcpath);
    return this.markSafe(ml);
  }
  exports.jsFile = jsFile;

  return exports;
}
exports.createForBuild = createForBuild;
