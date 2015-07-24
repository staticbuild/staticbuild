'use strict';

function createForBuild(build) {
  var exports = {};
  
  exports.t = build.translate.bind(build);
  exports.tn = build.translateNumeric.bind(build);
  
  function ellipsis(str, to) {
    var s = '';
    if (str === null || str === undefined)
      return str;
    s += str;
    if (s.length < to)
      return s;
    return s.substring(0, to) + '...';
  }
  exports.ellipsis = ellipsis;

  return exports;
}
exports.createForBuild = createForBuild;
