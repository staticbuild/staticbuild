'use strict';

/**
 * Performs a simple clone.
 * This is a streamlined version of npm clone@1.0.2.
 */
function clone(src) {
  var attrs;
  var dest;
  var proto;

  if (src === null || src === undefined)
    return null;
  if (typeof src != 'object')
    return src;
  
  if (isArray(src)) {
    dest = [];
  } else if (isRegExp(src)) {
    dest = new RegExp(src.source, getRegExpFlags(src));
    if (src.lastIndex)
      dest.lastIndex = src.lastIndex;
  } else if (isDate(src)) {
    dest = new Date(src.getTime());
  } else if (Buffer.isBuffer(src)) {
    dest = new Buffer(src.length);
    src.copy(dest);
    return dest;
  } else {
    proto = Object.getPrototypeOf(src);
    dest = Object.create(proto);
    // Copy all fields, skip readonly fields.
    for (var i in src) {
      attrs = Object.getOwnPropertyDescriptor(proto, i);
      if (attrs && attrs.set == null)
        continue;
      dest[i] = clone(src[i]);
    }
    return dest;
  }
  // Copy all fields.
  for (var i in src)
    dest[i] = clone(src[i]);
  return dest;
}
exports.clone = clone;

function copy(src, dest) {
  var i;
  if (src === undefined || src === null)
    return dest;
  if (dest === undefined || dest === null)
    dest = {};
  for (i in src)
    dest[i] = src[i];
  return dest;
}
exports.copy = copy;

function emptyFn() {
  
}
exports.emptyFn = emptyFn;

function toStr(o) {
  return Object.prototype.toString.call(o);
};
exports.toStr = toStr;

function isDate(o) {
  return typeof o === 'object' && toStr(o) === '[object Date]';
};
exports.isDate = isDate;

function isArray(o) {
  return typeof o === 'object' && toStr(o) === '[object Array]';
};
exports.isArray = isArray;

function isRegExp(o) {
  return typeof o === 'object' && toStr(o) === '[object RegExp]';
};
exports.isRegExp = isRegExp;

function getRegExpFlags(re) {
  var flags = '';
  if (re.global) flags += 'g';
  if (re.ignoreCase) flags += 'i';
  if (re.multiline) flags += 'm';
  return flags;
};
exports.getRegExpFlags = getRegExpFlags;

function printLine(line) {
  console.log(line);
}
exports.printLine = printLine;

function printLines(lines) {
  Array.prototype.forEach.apply(lines, [exports.printLine]);
}
exports.printLines = printLines;
