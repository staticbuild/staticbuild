'use strict';

// Nunjucks specific functions. This module is currently not in use.

function createForBuild(build) {
  var exports = {};
  
  function bundles(name, sourceType) {
    /*jshint validthis: true */
    var ml = build.bundles(name, sourceType);
    return this.markSafe(ml);
  }
  exports.bundles = bundles;
  
  function link(srcPath, relative) {
    /*jshint validthis: true */
    var ml = build.link(srcPath, relative);
    return this.markSafe(ml);
  }
  exports.link = link;
  
  function script(srcPath, relative) {
    /*jshint validthis: true */
    var ml = build.script(srcPath, relative);
    return this.markSafe(ml);
  }
  exports.script = script;
  
  function scriptCode(js) {
    /*jshint validthis: true */
    var ml = '<script type="text/javascript">' + js + '</script>';
    return this.markSafe(ml);
  }
  exports.scriptCode = scriptCode;

  exports.t = build.translate.bind(build);
  exports.tn = build.translateNumeric.bind(build);

  return exports;
}
exports.createForBuild = createForBuild;
