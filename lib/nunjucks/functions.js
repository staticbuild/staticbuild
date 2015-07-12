'use strict';

var staticbuild = require('../../index.js');

exports.t = staticbuild.translate;
exports.tn = staticbuild.translateNumeric;

function scriptJs(js) {
  var ml = '<script type="text/javascript">' + js + '</script>';
  return this.markSafe(ml);
}
exports.scriptJs = scriptJs;

function cssFile(srcpath) {
  if (!staticbuild.config.devmode)
    srcpath = staticbuild.appendFilenameVersion(srcpath, staticbuild.config.version);
  var ml = '<link rel="stylesheet" type="text/css" href="' + srcpath + '"/>';
  return this.markSafe(ml);
}
exports.cssFile = cssFile;

function jsFile(srcpath) {
  if (!staticbuild.config.devmode)
    srcpath = staticbuild.appendFilenameVersion(srcpath, staticbuild.config.version);
  var ml = '<script type="text/javascript" src="' + srcpath + '"></script>';
  return this.markSafe(ml);
}
exports.jsFile = jsFile;
