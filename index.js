'use strict';

var config = require('./lib/config.js');
var i18n = require('i18n');
var lodash = require('lodash');
var path = require('path');

// #region Cache Busting

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

// #endregion

// #region Configuration

exports.config = config;

// #endregion

// #region Locales

var currentLocale = config.locale;

i18n.configure({
  extension: '.json',
  indent: '  ',
  locales: config.locales,
  defaultLocale: config.defaultLocale,
  directory: config.localesdir,
  objectNotation: true,
  prefix: '',
  updateFiles: true
});

i18n.setLocale(currentLocale);

function translate(str, etc) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged();
  return i18n.__.apply(i18n, args);
}
exports.translate = translate;

function translateNumeric(singular, plural, value) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged();
  return i18n.__n.apply(i18n, args);
}
exports.translateNumeric = translateNumeric;

function updateLocaleIfChanged() {
  if (config.locale === currentLocale)
    return;
  currentLocale = config.locale;
  i18n.setLocale(currentLocale);
}

// #endregion
