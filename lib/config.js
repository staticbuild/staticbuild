'use strict';

// #region Imports
var fs = require('fs');
var istype = require('type-check').typeCheck;
var lodash = require('lodash');
var path = require('path');
// #endregion

var staticbuild = require('../index.js');
staticbuild.config = exports;

function createDefault() {
  var config = {
    
    // #region Core
    
    // TODO: Change the default of sourcedir to a magic string which causes config 
    // to search for "src" or "source". Alternatively, accept directory paths like
    // "src|source", split on the pipe and use the first existing entry.
    
    basedir: process.cwd(),
    data: {},
    datafile: '',
    destdir: 'dest',
    devmode: false,
    filename: 'staticbuild.json',
    filepath: '',
    path: process.cwd(),
    sourcedir: 'src',
    verbose: false,
    version: '0.0.0',
    // #endregion
    
    // #region Hashids
    hashids: {
      alphabet: '0123456789abcdefghijklmnopqrstuvwxyz',
      minLength: 4,
      salt: 'BpoIsQlrssEz56uUbfgLu5KNBkoCJiyY'
    },
    // #endregion
    
    // #region Locales
    defaultLocale: 'en',
    locale: 'en',
    locales: ['en'],
    localesdir: 'locales',
    // #endregion
    
    // #region Web Host
    favicon: 'favicon.ico',
    host: process.env.HOST || undefined,
    port: process.env.PORT || 8080,
    restart: false,
    restartDelay: 0,
    // #endregion
    
    // #region Template
    template: {
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
    },
    // #endregion
    
    // #region CSS
    css: {
      map: {
        enabled: true,
        inline: false
      },
      preprocessor: 'less'
    },
    // #endregion
    
    ignore: [
      '.gitignore',
      '*.layout.htm',
      '*.part.htm',
      '*.map'
    ],
    info: [],
    warnings: []
  };
  return config;
}
exports.createDefault = createDefault;

// #region Load

function load(opts) {
  var config = createDefault();
  applyOptions(config, opts);
  var result = {};
  if (!staticbuild.tryRequireNew(config.filepath, result))
    config.warnings.push(result.message);
  else {
    var data = result.obj;
    // priority loaders
    loadVerbosity(config, data);
    loadHashids(config, data);
    loadLocales(config, data);
    loadDirectories(config, data);
    
    // secondary loaders
    loadCss(config, data);
    loadDataFile(config, data);
    loadTemplates(config, data);
    loadWebHost(config, data);
  }
  return config;
}
exports.load = load;

function loadCss(config, data) {
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

function loadDirectories(config, data) {
  // source | sourcedir
  if (istype('String', data.sourcedir))
    config.sourcedir = data.sourcedir;
  else if (istype('String', data.source))
    config.sourcedir = data.source;
  config.sourcedir = staticbuild.resolvePath(config.sourcedir);
  
  // dest | destdir
  if (istype('String', data.destdir))
    config.destdir = data.destdir;
  else if (istype('String', data.dest))
    config.destdir = data.dest;
  config.destdir = staticbuild.resolvePath(config.destdir);
}

function loadDataFile(config, cfgdata) {
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
  var result = {};
  var fullpath = staticbuild.resolvePath(config.datafile);
  if (staticbuild.tryRequireNew(fullpath, result))
    config.data = result.obj;
}

function loadHashids(config, data) {
  var ch = config.hashids;
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
  exports.hashids = staticbuild.createHashids();
}

function loadLocales(config, data) {
  // defaultLocale
  if (istype('String', data.defaultLocale)) {
    config.defaultLocale = data.defaultLocale;
    config.locale = config.defaultLocale;
  }
  // localesdir
  if (istype('String', data.localesdir))
    config.localesdir = data.localesdir;
  config.localesdir = staticbuild.resolvePath(config.localesdir);
  // TODO: Read locales array from directory if it exists.
  // locales
  if (istype('Array', data.locales))
    config.locales = Array.prototype.slice.call(data.locales);
}

function loadTemplates(config, data) {
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
  loadTemplateGlobals(config);
}

function loadTemplateGlobals(config) {
  var tpl = config.template;
  var result = {
    extensions: {},
    filters: {},
    functions: {},
    globals: {}
  };
  // Read extensions, filters and functions.
  if (tpl.extensionsfile)
    staticbuild.tryRequireNew(
      staticbuild.resolvePath(tpl.extensionsfile), result.extensions);
  if (tpl.filtersfile)
    staticbuild.tryRequireNew(
      staticbuild.resolvePath(tpl.filtersfile), result.filters);
  if (tpl.functionsfile)
    staticbuild.tryRequireNew(
      staticbuild.resolvePath(tpl.functionsfile), result.functions);
  // Read globalsfile.
  if (tpl.globalsfile)
    staticbuild.tryRequireNew(
      staticbuild.resolvePath(tpl.globalsfile), result.globals);
  // Merge extensions, filters and functions into config.template.globals.
  var g = tpl.globals = lodash.merge(tpl.globals || {}, result.globals.obj);
  g.extensions = lodash.merge(g.extensions || {}, result.extensions.obj);
  g.filters = lodash.merge(g.filters || {}, result.filters.obj);
  g.functions = lodash.merge(g.functions || {}, result.functions.obj);
}

function loadVerbosity(config, data) {
  // verbose
  // - Can only be turned ON from config, not off.
  if (data.verbose === true || data.verbose > 0)
    config.verbose = data.verbose;
}

function loadWebHost(config, data) {
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

// #endregion

// #region Options

function applyOptions(config, opts) {
  if (istype('String', opts))
    opts = { path: String.prototype.trim.call(opts) };
  normalizePathArgs(opts);
  lodash.assign(config, opts);
}

function filePathFromPathOpts(opts) {
  if (opts.filepath !== undefined)
    return true;
  if (opts.path === undefined)
    return false;
  try {
    var stat = fs.statSync(opts.path);
    if (stat.isFile()) {
      opts.filepath = path.resolve(opts.path);
      return true;
    }
  } catch (err) {
  }
  return false;
}

function normalizePathArgs(opts) {
  if (filePathFromPathOpts(opts)) {
    opts.basedir = path.resolve(path.dirname(opts.filepath));
    opts.filename = path.basename(opts.filepath);
  }
  else if (opts.path !== undefined) {
    opts.filename = opts.filename || 'staticbuild.json';
    opts.basedir = path.resolve(opts.basedir || process.cwd(), opts.path);
    opts.filepath = path.join(opts.basedir, opts.filename);
  }
}

// #endregion

// #region Write

function writeFileSync(config, tofile) {
  var result;
  var INDENT = 2;
  
  config = lodash.cloneDeep(config || config);
  tofile = tofile || config.filepath;
  
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
}
exports.writeFileSync = writeFileSync;

// #endregion
