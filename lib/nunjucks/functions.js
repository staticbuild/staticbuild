'use strict';

var staticbuild = require('../../index.js');

exports.t = staticbuild.translate;
exports.tn = staticbuild.translateNumeric;

function scriptJs(js) {
  /*jshint validthis: true */
  var ml = '<script type="text/javascript">' + js + '</script>';
  return this.markSafe(ml);
}
exports.scriptJs = scriptJs;

function cssFile(srcpath) {
  /*jshint validthis: true */
  if (!staticbuild.config.devmode)
    srcpath = staticbuild.appendFilenameVersion(srcpath, staticbuild.config.version);
  var ml = '<link rel="stylesheet" type="text/css" href="' + srcpath + '"/>';
  return this.markSafe(ml);
}
exports.cssFile = cssFile;

function jsFile(srcpath) {
  /*jshint validthis: true */
  if (!staticbuild.config.devmode)
    srcpath = staticbuild.appendFilenameVersion(srcpath, staticbuild.config.version);
  var ml = '<script type="text/javascript" src="' + srcpath + '"></script>';
  return this.markSafe(ml);
}
exports.jsFile = jsFile;
