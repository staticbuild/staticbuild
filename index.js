'use strict';

// #region Imports
var config = require('./lib/config.js');
var fs = require('fs');
var Hashids = require('hashids');
var i18n = require('i18n');
var lodash = require('lodash');
var path = require('path');
var istype = require('type-check').typeCheck;
var requireNew = require('require-new');
// #endregion

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

var defaults = lodash.cloneDeep(config);
var loaded = false;

// #region Load

function load(args) {
  if (loaded === true)
    return true;
  
  var result = {};
  
  normalizePathArgs(args);
  lodash.assign(config, args);
  
  if (!requireFile(config.filepath, result))
    return false;
  
  if (!loadConfigValues(result.obj))
    return false;
  
  loaded = true;
  
  return true;
}
exports.loadConfig = load;

function loadConfigValues(data) {
  
  // priority loaders
  loadConfigVerbosity(data);
  loadConfigHashids(data);
  loadConfigLocales(data);
  loadConfigDirectories(data);
  
  // secondary loaders
  loadConfigCss(data);
  loadConfigDataFile(data);
  loadConfigTemplates(data);
  loadConfigWebHost(data);
  
  if (config.warnings.length > 0)
    return false;
  
  return true;
}

function loadConfigCss(data) {
  // css
  var css = data.css;
  if (istype('Object', css)) {
    // preprocessor
    if (istype('String', css.preprocessor))
      config.css.preprocessor = css.preprocessor;
    if (istype('Object', css.map)) {
      // enabled
      if (istype('Boolean', css.map.enabled))
        config.css.map.enabled = css.map.enabled === true;
      // inline
      if (istype('Boolean', css.map.inline))
        config.css.map.inline = css.map.inline === true;
    }
  }
}

function loadConfigDirectories(data) {
  // source | sourcedir
  if (istype('String', data.sourcedir))
    config.sourcedir = data.sourcedir;
  else if (istype('String', data.source))
    config.sourcedir = data.source;
  config.sourcedir = resolvePath(config.sourcedir);
  
  // dest | destdir
  if (istype('String', data.destdir))
    config.destdir = data.destdir;
  else if (istype('String', data.dest))
    config.destdir = data.dest;
  config.destdir = resolvePath(config.destdir);
}

function loadConfigDataFile(cfgdata) {
  var result = {};
  
  // data | datafile
  if (istype('String', cfgdata.data))
    config.datafile = cfgdata.data;
  else if (istype('String', cfgdata.datafile))
    config.datafile = cfgdata.datafile;
  else if (istype('Object', cfgdata.data)) {
    config.datafile = null;
    config.data = cfgdata.data;
  }
  
  if (!config.datafile)
    return;
  if (requireFile(resolvePath(config.datafile), result))
    config.data = result.obj;
}

function loadConfigHashids(data) {
  var hi = data.hashids;
  if (istype('Object', hi)) {
    // alphabet
    if (istype('String', hi.alphabet))
      config.hashids.alphabet = hi.alphabet;
    // minLength
    if (istype('Number', hi.minLength))
      config.hashids.minLength = hi.minLength;
    // salt
    if (istype('String', hi.salt))
      config.hashids.salt = hi.salt;
  }
  config.hashids.current = new Hashids(
    config.hashids.salt,
    config.hashids.minLength,
    config.hashids.alphabet
  );
}

function loadConfigLocales(data) {
  // defaultLocale
  if (istype('String', data.defaultLocale)) {
    config.defaultLocale = data.defaultLocale;
    config.locale = config.defaultLocale;
  }
  // localesdir
  if (istype('String', data.localesdir))
    config.localesdir = data.localesdir;
  config.localesdir = resolvePath(config.localesdir);
  // TODO: Read locales array from directory if it exists.
  // locales
  if (istype('Array', data.locales))
    config.locales = Array.prototype.slice.call(data.locales);
}

function loadConfigTemplates(data) {
  // template
  var tpl = data.template;
  if (istype('Object', tpl)) {
    
    // engine
    if (istype('String', tpl.engine))
      config.template.engine = tpl.engine;
    
    // extension
    if (istype('String', tpl.extension))
      config.template.extension = tpl.extension;
    
    // index | indexfile
    if (istype('String', tpl.index))
      config.template.indexfile = tpl.index;
    else if (istype('String', tpl.indexfile))
      config.template.indexfile = tpl.indexfile;
    
    // extensions, filters and functions.
    if (istype('String', tpl.extensions))
      config.template.extensionsfile = tpl.extensions;
    
    if (istype('String', tpl.filters))
      config.template.filtersfile = tpl.filters;
    
    if (istype('String', tpl.functions))
      config.template.functionsfile = tpl.functions;
    
    // globals | globalfiles
    if (istype('String', tpl.globals))
      config.template.globalsfile = tpl.globals;
    else if (istype('String', tpl.globalsfile))
      config.template.globalsfile = tpl.globalsfile;
    
    // locals | localsfile
    if (tpl.locals === true || tpl.localsfile === true)
      config.template.localsfile = '<filename>.+(js|json)';
    if (istype('String', tpl.locals))
      config.template.localsfile = tpl.locals;
    else if (istype('String', tpl.localsfile))
      config.template.localsfile = tpl.localsfile;
    
    // options
    if (istype('Object', tpl.options))
      config.template.options = lodash.cloneDeep(tpl.options);
  }
  loadTemplateGlobals();
}

function loadConfigVerbosity(data) {
  // verbose
  // - Can only be turned ON from config, not off.
  if (data.verbose === true || data.verbose > 0)
    config.verbose = data.verbose;
}

function loadConfigWebHost(data) {
  // host
  if (istype('String', data.host))
    config.host = data.host;
  // port
  if (istype('Number', data.port))
    config.port = data.port;
  // favicon
  if (istype('String', data.favicon))
    config.favicon = data.favicon;
}

function loadTemplateGlobals() {
  var tpl = config.template;
  var result = {
    extensions: {},
    filters: {},
    functions: {},
    globals: {}
  };
  // Read extensions, filters and functions.
  if (tpl.extensionsfile)
    requireFile(resolvePath(tpl.extensionsfile), result.extensions);
  if (tpl.filtersfile)
    requireFile(resolvePath(tpl.filtersfile), result.filters);
  if (tpl.functionsfile)
    requireFile(resolvePath(tpl.functionsfile), result.functions);
  // Read globalsfile.
  if (tpl.globalsfile)
    requireFile(resolvePath(tpl.globalsfile), result.globals);
  // Merge extensions, filters and functions into config.template.globals.
  var g = tpl.globals = lodash.merge(tpl.globals || {}, result.globals.obj);
  g.extensions = lodash.merge(g.extensions || {}, result.extensions.obj);
  g.filters = lodash.merge(g.filters || {}, result.filters.obj);
  g.functions = lodash.merge(g.functions || {}, result.functions.obj);
}
exports.reloadGlobals = loadTemplateGlobals;

// #endregion

// #region Paths

function filePathFromPathArgs(args) {
  if (args.filepath !== undefined)
    return true;
  if (args.path === undefined)
    return false;
  try {
    var stat = fs.statSync(args.path);
    if (stat.isFile()) {
      args.filepath = path.resolve(args.path);
      return true;
    }
  } catch (err) {
  }
  return false;
}

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

function normalizePathArgs(args) {
  if (filePathFromPathArgs(args)) {
    args.basedir = path.resolve(path.dirname(args.filepath));
    args.filename = path.basename(args.filepath);
  }
  else if (args.path !== undefined) {
    args.filename = args.filename || 'staticbuild.json';
    args.basedir = path.resolve(args.basedir || process.cwd(), args.path);
    args.filepath = path.join(args.basedir, args.filename);
  }
}

function resolvePath(to) {
  return path.resolve(config.basedir, to);
}
exports.resolvePath = resolvePath;

function resolveSrcPath(to) {
  return path.resolve(config.sourcedir, to);
}
exports.resolveSrcPath = resolveSrcPath;

// #endregion

// #region Write

function writeConfig(cfg, to) {
  var result;
  var INDENT = 2;
  
  cfg = lodash.cloneDeep(cfg || config);
  to = to || cfg.filepath;
  
  // Delete object data, make absolute paths relative.
  if (cfg.verbose !== true && cfg.verbose < 1)
    delete cfg.verbose;
  
  delete cfg.devmode;
  
  cfg.sourcedir = path.relative(cfg.basedir, cfg.sourcedir);
  delete cfg.basedir;
  delete cfg.path;
  
  cfg.data = cfg.datafile;
  delete cfg.datafile;
  
  cfg.localesdir = path.relative(cfg.basedir, cfg.localesdir);
  delete cfg.locale;
  
  delete cfg.filepath;
  delete cfg.filename;
  
  delete cfg.restart;
  delete cfg.restartDelay;
  
  delete cfg.template.globals;
  
  delete cfg.warnings;
  
  result = JSON.stringify(cfg, null, INDENT);
  
  fs.writeFileSync(to, result);
}
exports.writeConfig = writeConfig;

function writeConfigFile(to) {
  return writeConfig(config, to);
}
exports.writeConfigFile = writeConfigFile;

function writeDefaultConfigFile(to) {
  return writeConfig(defaults, to || config.filepath);
}
exports.writeDefaultConfigFile = writeDefaultConfigFile;

// #endregion

function requireFile(filepath, result) {
  if (filepath === undefined || filepath === null)
    return false;
  try {
    result.obj = requireNew(filepath);
    return true;
  }
  catch (err) {
    config.warnings.push('File not found: ' + filepath);
  }
  return false;
}
config.requireFile = requireFile;


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
