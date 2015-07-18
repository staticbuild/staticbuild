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
  
  // #region Data
  this.data = {};
  this.datafile = '';
  // #endregion
  
  // #region Directories
  this.destdir = 'dest';
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
    engine: {
      jade: {
        extension: 'jade',
        options: { pretty: true, cache: false }
      },
      nunjucks: {
        extension: 'htm',
        extensionsfile: '',
        filtersfile: '',
        options: { autoescape: true }
      }
    },
    functionsfile: '',
    globals: {},
    globalsfile: '',
    indexfile: 'index',
    localsfile: ''
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
  configureHashids(build, data);
  configureLocales(build, data);
  configureDirectories(build, data);
  configureCss(build, data);
  configureData(build, data);
  configureTemplates(build, data);
  configureWebHost(build, data);
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

function configureCss(build, data) {
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

function configureData(build, cfgdata) {
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

function configureTemplates(build, data) {
  // template
  var tpl = data.template;
  var eng;
  if (istype('Object', tpl)) {
    
    // buildvar
    if (istype('String', tpl.buildvar))
      build.template.buildvar = tpl.buildvar;

    // engine
    if (istype('Object', tpl.engine)) {
      // jade
      if (istype('Object', tpl.engine.jade)) {
        eng = tpl.engine.jade;
        if (istype('String', eng.extension))
          build.template.engine.jade.extension = eng.extension;
        if (istype('Object', eng.options))
          lodash.merge(build.template.engine.jade.options, eng.options);
      }
      // nunjucks
      if (istype('Object', tpl.engine.nunjucks)) {
        eng = tpl.engine.nunjucks;
        if (istype('String', eng.extension))
          build.template.engine.nunjucks.extension = eng.extension;
        if (istype('String', eng.extensions))
          build.template.engine.nunjucks.extensionsfile = eng.extensions;
        if (istype('String', eng.filters))
          build.template.engine.nunjucks.filtersfile = eng.filters;
        if (istype('Object', eng.options))
          lodash.merge(build.template.engine.nunjucks.options, eng.options);
      }
    }
    // index | indexfile
    if (istype('String', tpl.index))
      build.template.indexfile = tpl.index;
    else if (istype('String', tpl.indexfile))
      build.template.indexfile = tpl.indexfile;
    
    // functions.
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
  }
}

function configureWebHost(build, data) {
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
  if (build.datafile)
    build.datafile = build.resolvePath(build.datafile);
  if (build.template.engine.nunjucks.extensionsfile)
    build.template.engine.nunjucks.extensionsfile = build.resolvePath(build.template.engine.nunjucks.extensionsfile);
  if (build.template.engine.nunjucks.filtersfile)
    build.template.engine.nunjucks.filtersfile = build.resolvePath(build.template.engine.nunjucks.filtersfile);
  if (build.template.functionsfile)
    build.template.functionsfile = build.resolvePath(build.template.functionsfile);
  if (build.template.globalsfile)
    build.template.globalsfile = build.resolvePath(build.template.globalsfile);
  // Load stuff.
  loadPackage(build);
  // TODO: A function to read locales from directory if it exists.
  loadData(build);
  loadTemplateGlobals(build);
}

function loadData(build) {
  if (!build.datafile)
    return;
  var data = build.tryRequireNew(build.datafile);
  if (data)
    build.data = data;
}

function loadPackage(build) {
  if (!build.packagefile)
    return;
  var data = build.tryRequireNew(build.packagefile);
  if (data)
    build.pkg = data;
}

function loadTemplateGlobals(build) {
  var tpl = build.template;
  var loaded = {
    extensions: {},
    filters: {},
    functions: {},
    globals: {}
  };
  // Read extensions, filters and functions.
  if (tpl.engine.nunjucks.extensionsfile)
    loaded.extensions = build.tryRequireNew(tpl.engine.nunjucks.extensionsfile);
  if (tpl.engine.nunjucks.filtersfile)
    loaded.filters = build.tryRequireNew(tpl.engine.nunjucks.filtersfile);
  if (tpl.functionsfile)
    loaded.functions = build.tryRequireNew(tpl.functionsfile);
  // Read globalsfile.
  if (tpl.globalsfile)
    loaded.globals = build.tryRequireNew(tpl.globalsfile);
  
  // Merge extensions, filters and functions into build.template.globals.
  // TODO: Correct the merging here so that built-in globals are always at the 
  // base/merged first.
  var g = tpl.globals = lodash.merge(tpl.globals || {}, loaded.globals);
  g.extensions = lodash.merge(g.extensions || {}, loaded.extensions);
  
  var baseFilters = require('./lib/nunjucks/filters.js').createForBuild(build);
  g.filters = lodash.merge(g.filters || {}, baseFilters);
  g.filters = lodash.merge(g.filters, loaded.filters);
  
  var baseFns = require('./lib/nunjucks/functions.js').createForBuild(build);
  g.functions = lodash.merge(g.functions || {}, baseFns);
  g.functions = lodash.merge(g.functions, loaded.functions);
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
  var tpl = this.template;
  if (tpl.globalsfile)
    paths.push(tpl.globalsfile);
  if (tpl.engine.nunjucks.extensionsfile)
    paths.push(tpl.engine.nunjucks.extensionsfile);
  if (tpl.engine.nunjucks.filtersfile)
    paths.push(tpl.engine.nunjucks.filtersfile);
  if (tpl.functionsfile)
    paths.push(tpl.functionsfile);
  if (this.datafile)
    paths.push(this.datafile);
  if (this.packagefile)
    paths.push(this.packagefile);
  return paths;
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
  delete config.template.globals;
  
  delete config.restart;
  delete config.restartDelay;
  
  delete config.errors;
  delete config.info;
  delete config.warnings;
  
  var jsonStr = JSON.stringify(config, null, INDENT);
  
  fs.writeFileSync(tofile, jsonStr);
};

// #endregion
