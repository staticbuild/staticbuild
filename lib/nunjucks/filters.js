'use strict';

var staticbuild = require('../../index.js');

exports.t = staticbuild.translate;
exports.tn = staticbuild.translateNumeric;

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
