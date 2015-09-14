'use strict';

// Nunjucks specific functions. This module is currently not in use.

function createForBuild(build) {
  var exports = {};

  exports.t = build.translate.bind(build);
  exports.tn = build.translateNumeric.bind(build);
  
  function scriptJsCode(js) {
    var ml = '<script type="text/javascript">' + js + '</script>';
    return this.markSafe(ml);
  }
  exports.scriptJsCode = scriptJsCode;
  
  function linkCss(srcpath) {
    var ml = build.linkCss(srcpath);
    return this.markSafe(ml);
  }
  exports.linkCss = linkCss;
  
  function scriptJs(srcpath) {
    var ml = build.scriptJs(srcpath);
    return this.markSafe(ml);
  }
  exports.scriptJs = scriptJs;

  return exports;
}
exports.createForBuild = createForBuild;
