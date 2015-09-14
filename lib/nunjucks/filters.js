'use strict';

function createForBuild(build) {
  var exports = {};
  
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
  
  exports.t = build.translate.bind(build);
  exports.tn = build.translateNumeric.bind(build);

  return exports;
}
exports.createForBuild = createForBuild;
