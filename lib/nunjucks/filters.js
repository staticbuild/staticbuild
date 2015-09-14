'use strict';

function createForBuild(build) {
  var exports = {};
  
  function ellipsis(str, maxLength) {
    var s = '';
    if (str === null || str === undefined)
      return str;
    s += str;
    if (s.length < maxLength)
      return s;
    return s.substring(0, maxLength) + '...';
  }
  exports.ellipsis = ellipsis;
  
  exports.t = build.translate.bind(build);
  exports.tn = build.translateNumeric.bind(build);

  return exports;
}
exports.createForBuild = createForBuild;
