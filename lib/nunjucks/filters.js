'use strict';

var build = require('../../index.js').current;

exports.t = build.translate;
exports.tn = build.translateNumeric;

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
