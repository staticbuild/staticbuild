'use strict';

var config = require('./config.js');
var Hashids = require('hashids');
var lodash = require('lodash');
var path = require('path');

var hashingAlphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
var hashLengthMin = 4;
var hashids = new Hashids(
  config.salt,
  hashLengthMin,
  hashingAlphabet
);

exports.hashids = hashids;

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

function appendFilenameVersion(filepath, version, salt) {
  var ev = encodeVersion(version, salt);
  return appendFilenamePart(filepath, ev);
}
exports.appendFilenameVersion = appendFilenameVersion;

function encodeVersion(version, salt) {
  var verint = versionToInt(version);
  if (!salt)
    return hashids.encode(verint);
  var altids = new Hashids(salt, hashLengthMin, hashingAlphabet);
  return altids.encode(verint);
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
