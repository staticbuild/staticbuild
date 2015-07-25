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
  // #region Non-Constructor Call Handling
  if (!(this instanceof StaticBuild))
    return new StaticBuild(pathOrOpt, opt);
  // #endregion
  
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
  
  // #region Base
  this.basedir = process.cwd();
  this.devmode = false;
  this.filename = 'staticbuild.json';
  this.filepath = '';
  this.packagefile = 'package.json';
  this.pkg = {};
  this.path = process.cwd();
  this.verbose = false;
  // #endregion
  
  // #region Dev Server
  this.devhost = undefined;
  this.devport = 8080;
  this.restart = false;
  this.restartDelay = 0;
  // #endregion
  
  // #region Directories
  this.destdir = 'dist';
  this.sourcedir = 'src';
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
  
  // #region Engine
  this.defaultEngineName = 'jade';
  this.engine = {
    jade: {
      extension: 'jade',
      options: { pretty: true, cache: false }
    },
    less: {
      extension: 'less',
      map: { enabled: true, inline: false }
    },
    nunjucks: {
      extension: 'htm',
      extensions: undefined,
      extensionsfile: '',
      filters: undefined,
      filtersfile: '',
      functions: undefined,
      options: { autoescape: true }
    }
  };
  // #endregion
  
  // #region Views
  this.autocontext = true;
  this.buildvar = 'build';
  this.context = {};
  this.contextfile = '';
  this.defaultView = 'index';
  this.favicon = 'favicon.ico';
  // #endregion
  
  // #region Status
  this.errors = [];
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
  
  configure(this, opt);
  StaticBuild.current = this;
  load(this);
}
module.exports = StaticBuild;

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
StaticBuild.appendFilename = appendFilename;
StaticBuild.prototype.appendFilename = appendFilename;

function appendFilenamePart(filepath, part) {
  return StaticBuild.appendFilename(filepath, '-' + part);
}
StaticBuild.appendFilenamePart = appendFilenamePart;
StaticBuild.prototype.appendFilenamePart = appendFilenamePart;

StaticBuild.prototype.appendFilenameVersion = 
function (filepath, version) {
  var ev = this.encodeVersion(version || this.pkg.version);
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

// #region Configuration

function configure(build, opt) {
  // Normalize and apply options.
  normalizePathOptions(opt);
  lodash.assign(build, opt);
  // Configure from file.
  var data = build.tryRequireNew(build.filepath);
  if (!data)
    return;
  configureBase(build, data);
  configureDevServer(build, data);
  configureDirectories(build, data);
  configureEngine(build, data);
  configureHashids(build, data);
  configureLocales(build, data);
  configureViews(build, data);
}

function configureBase(build, data) {
  // verbose
  // - Can only be turned ON from build, not off.
  if (data.verbose === true || data.verbose > 0)
    build.verbose = data.verbose;
  // package | packagefile
  if (istype('String', data["package"]))
    build.packagefile = data["package"];
  else if (istype('String', data.packagefile))
    build.packagefile = data.packagefile;
}

function configureDevServer(build, data) {
  // devhost
  if (istype('String', data.devhost))
    build.devhost = data.devhost;
  // devport
  if (istype('Number', data.devport))
    build.devport = data.devport;
}

function configureDirectories(build, data) {
  // source | sourcedir
  if (istype('String', data.sourcedir))
    build.sourcedir = data.sourcedir;
  else if (istype('String', data.source))
    build.sourcedir = data.source;
  
  // dest | destdir
  if (istype('String', data.destdir))
    build.destdir = data.destdir;
  else if (istype('String', data.dest))
    build.destdir = data.dest;
}

function configureEngine(build, data) {
  if (istype('Object', data.engine)) {
    configureJade(build, data.engine);
    configureLESS(build, data.engine);
    configureNunjucks(build, data.engine);
  }
  if (
    istype('String', data.defaultEngine) 
    && data.defaultEngine in build.engine 
    && data.defaultEngine !== build.defaultEngineName 
  )
    build.defaultEngineName = data.defaultEngine;
}

function configureHashids(build, data) {
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

function configureJade(build, data) {
  var jade = data.jade;
  if (!istype('Object', jade))
    return;
  // extension
  if (istype('String', jade.extension))
    build.engine.jade.extension = jade.extension;
  // options
  if (istype('Object', data.options))
    lodash.merge(build.engine.jade.options, data.options);
}

function configureLESS(build, data) {
  var less = data.less;
  if (!istype('Object', less))
    return;
  // extension
  if (istype('String', less.extension))
    build.engine.less.extension = less.extension;
  if (istype('Object', less.map)) {
    // enabled
    if (istype('Boolean', less.map.enabled))
      build.engine.less.map.enabled = less.map.enabled === true;
    // inline
    if (istype('Boolean', less.map.inline))
      build.engine.less.map.inline = less.map.inline === true;
  }
}

function configureLocales(build, data) {
  // defaultLocale
  if (istype('String', data.defaultLocale)) {
    build.defaultLocale = data.defaultLocale;
    build.locale = build.defaultLocale;
  }
  // localesdir
  if (istype('String', data.localesdir))
    build.localesdir = data.localesdir;
  
  // locales
  if (istype('Array', data.locales))
    build.locales = Array.prototype.slice.call(data.locales);
}

function configureNunjucks(build, data) {
  var nunjucks = data.nunjucks;
  if (!istype('Object', nunjucks))
    return;
  // extension
  if (istype('String', nunjucks.extension))
    build.engine.nunjucks.extension = nunjucks.extension;
  // extensions | extensionsfile
  if (istype('String', nunjucks.extensions))
    build.engine.nunjucks.extensionsfile = nunjucks.extensions;
  else if (istype('String', nunjucks.extensionsfile))
    build.engine.nunjucks.extensionsfile = nunjucks.extensionsfile;
  // filters | filtersfile
  if (istype('String', nunjucks.filters))
    build.engine.nunjucks.filtersfile = nunjucks.filters;
  else if (istype('String', nunjucks.filtersfile))
    build.engine.nunjucks.filtersfile = nunjucks.filtersfile;
  // options
  if (istype('Object', nunjucks.options))
    lodash.merge(build.engine.nunjucks.options, nunjucks.options);
}

function configureViews(build, data) {
  // autocontext
  if (istype('Boolean', data.autocontext))
    build.autocontext = data.autocontext;
  // buildvar
  if (istype('String', data.buildvar))
    build.buildvar = data.buildvar;
  // context | contextfile
  if (istype('String', data.context))
    build.contextfile = data.context;
  else if (istype('String', data.contextfile))
    build.contextfile = data.contextfile;
  else if (istype('Object', data.context)) {
    build.contextfile = null;
    build.context = data.context;
  }
  // defaultview | defaultView
  if (istype('String', data.defaultview))
    build.defaultView = data.defaultview;
  else if (istype('String', data.defaultView))
    build.defaultView = data.defaultView;
  // favicon
  if (istype('String', data.favicon))
    build.favicon = data.favicon;
}

// #endregion

// #region Load

function load(build) {
  // Resolve all paths.
  if (build.packagefile)
    build.packagefile = build.resolvePath(build.packagefile);
  if (build.sourcedir)
    build.sourcedir = build.resolvePath(build.sourcedir);
  if (build.destdir)
    build.destdir = build.resolvePath(build.destdir);
  if (build.localesdir)
    build.localesdir = build.resolvePath(build.localesdir);
  if (build.engine.nunjucks.extensionsfile)
    build.engine.nunjucks.extensionsfile = build.resolvePath(build.engine.nunjucks.extensionsfile);
  if (build.engine.nunjucks.filtersfile)
    build.engine.nunjucks.filtersfile = build.resolvePath(build.engine.nunjucks.filtersfile);
  if (build.contextfile)
    build.globalsfile = build.resolvePath(build.contextfile);
  // Load stuff.
  loadPackage(build);
  loadLocales(build);
  loadViewContext(build);
  loadNunjucksFiles(build);
}

function loadLocales(build) {
  // TODO: Load locale names from localesdir if it exists.
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

function loadPackage(build) {
  if (!build.packagefile)
    return;
  var data = build.tryRequireNew(build.packagefile);
  if (data)
    build.pkg = data;
}

function loadNunjucksFiles(build) {
  var nunjucks = build.engine.nunjucks;
  var loaded = {};
  // Read extensions and filters.
  if (nunjucks.extensionsfile)
    loaded.extensions = build.tryRequireNew(nunjucks.extensionsfile);
  if (nunjucks.filtersfile)
    loaded.filters = build.tryRequireNew(nunjucks.filtersfile);
  
  if (loaded.extensions)
    nunjucks.extensions = lodash.merge(nunjucks.extensions, loaded.extensions);
  
  nunjucks.filters = require('./lib/nunjucks/filters.js').createForBuild(build);
  if (loaded.filters)
    nunjucks.filters = lodash.merge(nunjucks.filters, loaded.filters);

  // Some core functions specialized for nunjucks.
  nunjucks.functions = require('./lib/nunjucks/functions.js').createForBuild(build);
}

function loadViewContext(build) {
  var context = build.context;
  if (build.contextfile)
    context = build.context = 
      build.tryRequireNew(build.contextfile) || context;
  if (build.autocontext) {
    // Add some stuff to the global context.
    if (build.buildvar)
      context[build.buildvar] = build;
    context.t = build.translate.bind(build);
    context.tn = build.translateNumeric.bind(build);
  }
}

function createViewContext() {
  var context = build.context;
  if (build.autocontext) {
    // Add some stuff to the global context.
    if (build.buildvar)
      context[build.buildvar] = build;
    context.t = build.translate.bind(build);
    context.tn = build.translateNumeric.bind(build);
  }
  return context;
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

StaticBuild.prototype.cssFile =
function (srcpath) {
  if (!this.devmode)
    srcpath = this.appendFilenameVersion(srcpath, this.pkg.version);
  var ml = '<link rel="stylesheet" type="text/css" href="' + srcpath + '"/>';
  return ml;
};

StaticBuild.prototype.dest =
function (pattern) {
  return this.relativePattern(this.destdir, pattern);
};

StaticBuild.prototype.destLocale =
function (pattern) {
  return this.relativePattern(path.join(this.destdir, this.locale), pattern);
};

StaticBuild.prototype.getWatchPaths = 
function () {
  var paths = [
    this.filepath
  ];
  if (this.contextfile)
    paths.push(this.contextfile);
  if (this.engine.nunjucks.extensionsfile)
    paths.push(this.engine.nunjucks.extensionsfile);
  if (this.engine.nunjucks.filtersfile)
    paths.push(this.engine.nunjucks.filtersfile);
  if (this.packagefile)
    paths.push(this.packagefile);
  return paths;
};

StaticBuild.prototype.jsFile =
function (srcpath) {
  if (!this.devmode)
    srcpath = this.appendFilenameVersion(srcpath, this.pkg.version);
  var ml = '<script type="text/javascript" src="' + srcpath + '"></script>';
  return ml;
};

StaticBuild.prototype.relativePath =
function (to) {
  return path.relative(this.basedir, to).replace('\\', '/');
};

StaticBuild.prototype.relativePattern =
function (to, pattern) {
  if (pattern === undefined || pattern === null || !pattern.length)
    return this.relativePath(to);
  var prefix = pattern.charAt(0);
  if (prefix === '!')
    return prefix + this.relativePath(to) + pattern.substr(1);
  else
    return this.relativePath(to) + pattern;
};

StaticBuild.prototype.resolvePath = 
function (to) {
  return path.resolve(this.basedir, to);
};

StaticBuild.prototype.resolveSrcPath = 
function (to) {
  return path.resolve(this.sourcedir, to);
};

StaticBuild.prototype.src =
function (pattern) {
  return this.relativePattern(this.sourcedir, pattern);
};

function tryRequireNew(filepath) {
  var build, errMsg;
  if (filepath === undefined || filepath === null)
    return;
  try {
    return requireNew(filepath);
  } catch (err) {
    errMsg = err.code === 'MODULE_NOT_FOUND' ? 
        'File not found: ' + filepath :
        'Error loading file ' + filepath + ' - ' + err.toString();
    build = this instanceof StaticBuild ? this : StaticBuild.current;
    if (build)
      build.warnings.push(errMsg);
    else
      console.error(errMsg);
  }
}
StaticBuild.tryRequireNew = tryRequireNew;
StaticBuild.prototype.tryRequireNew = tryRequireNew;

// #endregion

// #region Write

StaticBuild.prototype.writeFileSync = 
function (tofile) {
  var INDENT = 2;
  
  tofile = tofile || 'staticbuild.json';
  
  var config = lodash.cloneDeep(this);
  
  //
  if (config.datafile)
    config.data = config.datafile;
  else
    config.data = "";
  
  // Make absolute paths relative.
  config.dest = path.relative(config.basedir, config.destdir);
  config.localesdir = path.relative(config.basedir, config.localesdir);
  config.source = path.relative(config.basedir, config.sourcedir);
  
  // Delete object data.
  delete config.basedir;
  delete config.destdir;
  delete config.devmode;
  delete config.filepath;
  delete config.filename;
  delete config.pkg;
  delete config.packagefile;
  delete config.path;
  delete config.sourcedir;
  delete config.verbose;
  
  delete config.hashids.current;
  delete config.datafile;
  delete config.locale;
  
  delete config.restart;
  delete config.restartDelay;
  
  delete config.errors;
  delete config.info;
  delete config.warnings;
  
  var jsonStr = JSON.stringify(config, null, INDENT);
  
  fs.writeFileSync(tofile, jsonStr);
};

// #endregion
