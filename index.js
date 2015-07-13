'use strict';

// #region Imports
var Hashids = require('hashids');
var i18n = require('i18n');
var lodash = require('lodash');
var path = require('path');
var requireNew = require('require-new');
// #endregion

/** staticbuild @namespace */
var staticbuild = {};
exports = module.exports = staticbuild;

require('./lib/config.js');

// #region Hashids

function createHashids() {
  var ch = config.hashids;
  return new Hashids(
    ch.salt,
    ch.minLength,
    ch.alphabet
  );
}
exports.createHashids = createHashids;

// #endregion

// #region Cache Busting

/** Appends a value to the file name, before the extension. */
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
  return exports.hashids.encode(verint);
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

// #region Paths

function getWatchPaths() {
  var paths = [
    config.filepath
  ];
  var tpl = config.template;
  if (tpl.globalsfile)
    paths.push(config.resolvePath(tpl.globalsfile));
  if (tpl.extensionsfile)
    paths.push(config.resolvePath(tpl.extensionsfile));
  if (tpl.filtersfile)
    paths.push(config.resolvePath(tpl.filtersfile));
  if (tpl.functionsfile)
    paths.push(config.resolvePath(tpl.functionsfile));
  if (config.datafile)
    paths.push(config.resolvePath(config.datafile));
  return paths;
}
exports.getWatchPaths = getWatchPaths;

function resolvePath(to) {
  return path.resolve(config.basedir, to);
}
exports.resolvePath = resolvePath;

function resolveSrcPath(to) {
  return path.resolve(config.sourcedir, to);
}
exports.resolveSrcPath = resolveSrcPath;

function tryRequireNew(filepath, result) {
  if (filepath === undefined || filepath === null)
    return false;
  try {
    result.obj = requireNew(filepath);
    return true;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND')
      result.message = 'File not found: ' + filepath;
    else
      result.message = err.toString();
  }
  return false;
}
exports.tryRequireNew = tryRequireNew;

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
