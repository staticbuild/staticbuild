'use strict';

var locale = require('../locale.js');

exports.t = locale.translate;
exports.tn = locale.translateNumeric;

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
