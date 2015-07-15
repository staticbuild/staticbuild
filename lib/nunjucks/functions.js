'use strict';

var build = require('../../index.js').current;

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
  if (!build.devmode)
    srcpath = build.appendFilenameVersion(srcpath, build.version);
  var ml = '<link rel="stylesheet" type="text/css" href="' + srcpath + '"/>';
  return this.markSafe(ml);
}
exports.cssFile = cssFile;

function jsFile(srcpath) {
  /*jshint validthis: true */
  if (!build.devmode)
    srcpath = build.appendFilenameVersion(srcpath, build.version);
  var ml = '<script type="text/javascript" src="' + srcpath + '"></script>';
  return this.markSafe(ml);
}
exports.jsFile = jsFile;
