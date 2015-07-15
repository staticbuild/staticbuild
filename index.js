'use strict';

// #region Imports
var fs = require('fs');
var Hashids = require('hashids');
var i18n = require('i18n');
var istype = require('type-check').typeCheck;
var lodash = require('lodash');
var path = require('path');
var requireNew = require('require-new');
// #endregion

function StaticBuild(pathOrOpt, opt) {
  // #region Options
  opt = lodash.assign({
    // Required
    path: (istype('String', pathOrOpt) ? 
      String.prototype.trim.call(pathOrOpt) : ''),
    // Optional
    devmode: false,
    verbose: 0,
    restart: false,
    restartDelay: 0
  }, opt);
  // #endregion
  
  // #region Core
  this.basedir = process.cwd();
  this.data = {};
  this.datafile = '';
  this.destdir = 'dest';
  this.devmode = false;
  this.filename = 'staticbuild.json';
  this.filepath = '';
  this.path = process.cwd();
  this.sourcedir = 'src';
  this.verbose = false;
  this.version = '0.0.0';
  // #endregion
  
  // #region Hashids
  this.hashids = {
    alphabet: '0123456789abcdefghijklmnopqrstuvwxyz',
    minLength: 4,
    salt: 'BpoIsQlrssEz56uUbfgLu5KNBkoCJiyY'
  };
  // #endregion
  
  // #region Locales
  this.defaultLocale = 'en';
  this.locale = 'en';
  this.locales = ['en'];
  this.localesdir = 'locales';
  // #endregion
  
  // #region Web Host
  this.favicon = 'favicon.ico';
  this.host = process.env.HOST || undefined;
  this.port = process.env.PORT || 8080;
  this.restart = false;
  this.restartDelay = 0;
  // #endregion
  
  // #region Template
  this.template = {
    buildvar: 'build',
    engine: 'nunjucks',
    extension: 'htm',
    extensionsfile: '',
    filtersfile: '',
    functionsfile: '',
    globals: {},
    globalsfile: '',
    indexfile: 'index',
    localsfile: '',
    options: {
      autoescape: true
    }
  };
  // #endregion
  
  // #region CSS
  this.css = {
    map: {
      enabled: true,
      inline: false
    },
    preprocessor: 'less'
  };
  // #endregion
  
  // #region Status
  this.info = [];
  this.warnings = [];
  // #endregion
  
  // #region Ignore Files
  this.ignore = [
    '.gitignore',
    '*.layout.htm',
    '*.part.htm',
    '*.map'
  ];
  // #endregion
  
  load(this, opt);
  StaticBuild.current = this;
  loadData(this);
  loadTemplateGlobals(this);
}
module.exports = StaticBuild;

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
StaticBuild.appendFilename = appendFilename;
StaticBuild.prototype.appendFilename = appendFilename;

function appendFilenamePart(filepath, part) {
  return StaticBuild.appendFilename(filepath, '-' + part);
}
StaticBuild.appendFilenamePart = appendFilenamePart;
StaticBuild.prototype.appendFilenamePart = appendFilenamePart;

StaticBuild.prototype.appendFilenameVersion = 
function (filepath, version) {
  var ev = this.encodeVersion(version);
  return StaticBuild.appendFilenamePart(filepath, ev);
};

StaticBuild.prototype.encodeVersion = 
function (version) {
  var verint = StaticBuild.versionToInt(version);
  return this.hashids.current.encode(verint);
};

function versionToInt(version) {
  version = String.prototype.trim.call(version);
  var parts = String.prototype.split.call(version, '.');
  var i, len = parts.length;
  for (i = 0; i < len; i++)
    parts[i] = lodash.padLeft(parts[i], 3, '0');
  version = parts.join('');
  return parseInt(version, 10);
}
StaticBuild.versionToInt = versionToInt;
StaticBuild.prototype.versionToInt = versionToInt;

// #endregion

// #region Load

function load(build, opt) {
  
  normalizePathOptions(opt);
  lodash.assign(build, opt);
  
  var result = {};
  if (!tryRequireNew(build.filepath, result))
    build.warnings.push(result.message);
  else {
    var data = result.obj;
    // priority loaders
    loadVerbosity(build, data);
    loadHashids(build, data);
    loadLocales(build, data);
    loadDirectories(build, data);
    
    // secondary loaders
    loadCss(build, data);
    loadDataConfig(build, data);
    loadTemplates(build, data);
    loadWebHost(build, data);
  }
}

function loadCss(build, data) {
  // css
  var css = data.css;
  if (istype('Object', css)) {
    // preprocessor
    if (istype('String', css.preprocessor))
      build.css.preprocessor = css.preprocessor;
    if (istype('Object', css.map)) {
      // enabled
      if (istype('Boolean', css.map.enabled))
        build.css.map.enabled = css.map.enabled === true;
      // inline
      if (istype('Boolean', css.map.inline))
        build.css.map.inline = css.map.inline === true;
    }
  }
}

function loadDirectories(build, data) {
  // source | sourcedir
  if (istype('String', data.sourcedir))
    build.sourcedir = data.sourcedir;
  else if (istype('String', data.source))
    build.sourcedir = data.source;
  build.sourcedir = build.resolvePath(build.sourcedir);
  
  // dest | destdir
  if (istype('String', data.destdir))
    build.destdir = data.destdir;
  else if (istype('String', data.dest))
    build.destdir = data.dest;
  build.destdir = build.resolvePath(build.destdir);
}

function loadData(build) {
  if (!build.datafile)
    return;
  var result = {};
  var fullpath = build.resolvePath(build.datafile);
  if (tryRequireNew(fullpath, result))
    build.data = result.obj;
}

function loadDataConfig(build, cfgdata) {
  // data | datafile
  if (istype('String', cfgdata.data))
    build.datafile = cfgdata.data;
  else if (istype('String', cfgdata.datafile))
    build.datafile = cfgdata.datafile;
  else if (istype('Object', cfgdata.data)) {
    build.datafile = null;
    build.data = cfgdata.data;
  }
}

function loadHashids(build, data) {
  var ch = build.hashids;
  var hi = data.hashids;
  if (istype('Object', hi)) {
    // alphabet
    if (istype('String', hi.alphabet))
      ch.alphabet = hi.alphabet;
    // minLength
    if (istype('Number', hi.minLength))
      ch.minLength = hi.minLength;
    // salt
    if (istype('String', hi.salt))
      ch.salt = hi.salt;
  }
  build.hashids.current = new Hashids(
    ch.salt,
    ch.minLength,
    ch.alphabet
  );
}

function loadLocales(build, data) {
  // defaultLocale
  if (istype('String', data.defaultLocale)) {
    build.defaultLocale = data.defaultLocale;
    build.locale = build.defaultLocale;
  }
  // localesdir
  if (istype('String', data.localesdir))
    build.localesdir = data.localesdir;
  build.localesdir = build.resolvePath(build.localesdir);
  // TODO: Read locales array from directory if it exists.
  // locales
  if (istype('Array', data.locales))
    build.locales = Array.prototype.slice.call(data.locales);
  
  i18n.configure({
    extension: '.json',
    indent: '  ',
    locales: build.locales,
    defaultLocale: build.defaultLocale,
    directory: build.localesdir,
    objectNotation: true,
    prefix: '',
    updateFiles: true
  });
  i18n.setLocale(build.locale);
  currentLocale = build.locale;
}

function loadTemplates(build, data) {
  // template
  var tpl = data.template;
  if (istype('Object', tpl)) {
    
    // buildvar
    if (istype('String', tpl.buildvar))
      build.template.buildvar = tpl.buildvar;

    // engine
    if (istype('String', tpl.engine))
      build.template.engine = tpl.engine;
    
    // extension
    if (istype('String', tpl.extension))
      build.template.extension = tpl.extension;
    
    // index | indexfile
    if (istype('String', tpl.index))
      build.template.indexfile = tpl.index;
    else if (istype('String', tpl.indexfile))
      build.template.indexfile = tpl.indexfile;
    
    // extensions, filters and functions.
    if (istype('String', tpl.extensions))
      build.template.extensionsfile = tpl.extensions;
    
    if (istype('String', tpl.filters))
      build.template.filtersfile = tpl.filters;
    
    if (istype('String', tpl.functions))
      build.template.functionsfile = tpl.functions;
    
    // globals | globalfiles
    if (istype('String', tpl.globals))
      build.template.globalsfile = tpl.globals;
    else if (istype('String', tpl.globalsfile))
      build.template.globalsfile = tpl.globalsfile;
    
    // locals | localsfile
    if (tpl.locals === true || tpl.localsfile === true)
      build.template.localsfile = '<filename>.+(js|json)';
    if (istype('String', tpl.locals))
      build.template.localsfile = tpl.locals;
    else if (istype('String', tpl.localsfile))
      build.template.localsfile = tpl.localsfile;
    
    // options
    if (istype('Object', tpl.options))
      build.template.options = lodash.cloneDeep(tpl.options);
  }
}

function loadTemplateGlobals(build) {
  var tpl = build.template;
  var result = {
    extensions: {},
    filters: {},
    functions: {},
    globals: {}
  };
  // Read extensions, filters and functions.
  if (tpl.extensionsfile)
    tryRequireNew(
      build.resolvePath(tpl.extensionsfile), result.extensions);
  if (tpl.filtersfile)
    tryRequireNew(
      build.resolvePath(tpl.filtersfile), result.filters);
  if (tpl.functionsfile)
    tryRequireNew(
      build.resolvePath(tpl.functionsfile), result.functions);
  // Read globalsfile.
  if (tpl.globalsfile)
    tryRequireNew(
      build.resolvePath(tpl.globalsfile), result.globals);
  
  // Merge extensions, filters and functions into build.template.globals.
  // TODO: Correct the merging here so that built-in globals are always at the 
  // base/merged first.
  var g = tpl.globals = lodash.merge(tpl.globals || {}, result.globals.obj);
  g.extensions = lodash.merge(g.extensions || {}, result.extensions.obj);
  
  var baseFilters = require('./lib/nunjucks/filters.js').createForBuild(build);
  g.filters = lodash.merge(g.filters || {}, baseFilters)
  g.filters = lodash.merge(g.filters, result.filters.obj);
  
  var baseFns = require('./lib/nunjucks/functions.js').createForBuild(build);
  g.functions = lodash.merge(g.functions || {}, baseFns);
  g.functions = lodash.merge(g.functions, result.functions.obj);
}

function loadVerbosity(build, data) {
  // verbose
  // - Can only be turned ON from build, not off.
  if (data.verbose === true || data.verbose > 0)
    build.verbose = data.verbose;
}

function loadWebHost(build, data) {
  // host
  if (istype('String', data.host))
    build.host = data.host;
  // port
  if (istype('Number', data.port))
    build.port = data.port;
  // favicon
  if (istype('String', data.favicon))
    build.favicon = data.favicon;
}

// #endregion

// #region Locales

var currentLocale;

StaticBuild.prototype.translate = 
function (str, etc) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged(this);
  return i18n.__.apply(i18n, args);
};

StaticBuild.prototype.translateNumeric = 
function (singular, plural, value) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged(this);
  return i18n.__n.apply(i18n, args);
};

function updateLocaleIfChanged(build) {
  if (build.locale === currentLocale)
    return;
  i18n.setLocale(build.locale);
  currentLocale = build.locale;
}

// #endregion

// #region Options

function fileFromPathOption(opt) {
  if (opt.filepath !== undefined)
    return true;
  if (opt.path === undefined)
    return false;
  try {
    var stat = fs.statSync(opt.path);
    if (stat.isFile()) {
      opt.filepath = path.resolve(opt.path);
      return true;
    }
  } catch (err) {
  }
  return false;
}

function normalizePathOptions(opt) {
  if (fileFromPathOption(opt)) {
    opt.basedir = path.resolve(path.dirname(opt.filepath));
    opt.filename = path.basename(opt.filepath);
  }
  else if (opt.path !== undefined) {
    opt.filename = opt.filename || 'staticbuild.json';
    opt.basedir = path.resolve(opt.basedir || process.cwd(), opt.path);
    opt.filepath = path.join(opt.basedir, opt.filename);
  }
}

// #endregion

// #region Paths

StaticBuild.prototype.getWatchPaths = 
function () {
  var paths = [
    this.filepath
  ];
  var tpl = this.template;
  if (tpl.globalsfile)
    paths.push(this.resolvePath(tpl.globalsfile));
  if (tpl.extensionsfile)
    paths.push(this.resolvePath(tpl.extensionsfile));
  if (tpl.filtersfile)
    paths.push(this.resolvePath(tpl.filtersfile));
  if (tpl.functionsfile)
    paths.push(this.resolvePath(tpl.functionsfile));
  if (this.datafile)
    paths.push(this.resolvePath(this.datafile));
  return paths;
};

StaticBuild.prototype.resolvePath = 
function (to) {
  return path.resolve(this.basedir, to);
};

StaticBuild.prototype.resolveSrcPath = 
function (to) {
  return path.resolve(this.sourcedir, to);
};

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
StaticBuild.tryRequireNew = tryRequireNew;
StaticBuild.prototype.tryRequireNew = tryRequireNew;

// #endregion

// #region Write

StaticBuild.prototype.writeFileSync = 
function (tofile) {
  var result;
  var INDENT = 2;
  
  var config = lodash.cloneDeep(this);
  
  // Delete object data, make absolute paths relative.
  if (config.verbose !== true && config.verbose < 1)
    delete config.verbose;
  
  delete config.devmode;
  
  config.sourcedir = path.relative(config.basedir, config.sourcedir);
  delete config.basedir;
  delete config.path;
  
  config.data = config.datafile;
  delete config.datafile;
  
  config.localesdir = path.relative(config.basedir, config.localesdir);
  delete config.locale;
  
  delete config.filepath;
  delete config.filename;
  
  delete config.restart;
  delete config.restartDelay;
  
  delete config.template.globals;
  
  delete config.warnings;
  
  result = JSON.stringify(config, null, INDENT);
  
  fs.writeFileSync(tofile, result);
};

// #endregion
