'use strict';

var buildutil = require('../util.js');
var config = require('../config.js');
var locale = require('../locale.js');

exports.t = locale.translate;
exports.tn = locale.translateNumeric;

function scriptJs(js) {
  var ml = '<script type="text/javascript">' + js + '</script>';
  return this.markSafe(ml);
}
exports.scriptJs = scriptJs;

function cssFile(srcpath) {
  if (!config.devmode)
    srcpath = buildutil.appendFilenameVersion(srcpath, config.version);
  var ml = '<link rel="stylesheet" type="text/css" href="' + srcpath + '"/>';
  return this.markSafe(ml);
}
exports.cssFile = cssFile;

function jsFile(srcpath) {
  if (!config.devmode)
    srcpath = buildutil.appendFilenameVersion(srcpath, config.version);
  var ml = '<script type="text/javascript" src="' + srcpath + '"></script>';
  return this.markSafe(ml);
}
exports.jsFile = jsFile;
