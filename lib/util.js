'use strict';

var config = require('./config.js');
var lodash = require('lodash');
var path = require('path');

function appendFilename(filepath, valueToAppend) {
  var pfile = path.parse(filepath);
  var result = Array.prototype.join.call([
    pfile.dir,
    '/',
    pfile.name,
    valueToAppend,
    pfile.ext
  ], '');
  return result;
}
exports.appendFilename = appendFilename;

function appendFilenamePart(filepath, part) {
  return appendFilename(filepath, '-' + part);
}
exports.appendFilenamePart = appendFilenamePart;

function appendFilenameVersion(filepath, version) {
  var ev = encodeVersion(version);
  return appendFilenamePart(filepath, ev);
}
exports.appendFilenameVersion = appendFilenameVersion;

function encodeVersion(version) {
  var verint = versionToInt(version);
  return config.hashids.current.encode(verint);
}
exports.encodeVersion = encodeVersion;

function versionToInt(version) {
  version = String.prototype.trim.call(version);
  var parts = String.prototype.split.call(version, '.');
  var i, len = parts.length;
  for (i = 0; i < len; i++)
    parts[i] = lodash.padLeft(parts[i], 3, '0');
  version = parts.join('');
  return parseInt(version, 10);
}
exports.versionToInt = versionToInt;
