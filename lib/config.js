'use strict';

// #region Imports
// External
var fs = require('fs');
var lodash = require('lodash');
var path = require('path');
var istype = require('type-check').typeCheck;
var requireNew = require('require-new');
// Internal
var cli = require('./cli.js');
// #endregion

var clargs = cli.args;
var loaded = false;

var config = {
  
  // #region Core
  
  // TODO: Change the default of sourcedir to a magic string which causes config 
  // to search for "src" or "source". Alternatively, accept directory paths like
  // "src|source", split on the pipe and use the first existing entry.
  
  basedir: process.cwd(),
  data: {},
  datafile: 'staticbuild.data.json',
  destdir: 'dest',
  filename: 'staticbuild.json',
  filepath: '',
  path: process.cwd(),
  sourcedir: 'src',
  verbose: clargs.verbose === true,
  // #endregion
  
  // #region Hashids
  salt: 'BpoIsQlrssEz56uUbfgLu5KNBkoCJiyY',
  // #endregion
  
  // #region Locales
  defaultLocale: 'en',
  locales: ['en'],
  localesdir: 'locales',
  // #endregion
  
  // #region Web Host
  favicon: 'favicon.ico',
  host: process.env.HOST || undefined,
  port: process.env.PORT || 8080,
  restart: clargs.restart,
  restartDelay: clargs.restartDelay,
  // #endregion
  
  // #region Template
  template: {
    engine: 'nunjucks',
    extension: 'htm',
    extensionsfile: '',
    filtersfile: '',
    functionsfile: '',
    globals: {},
    globalsfile: 'staticbuild.htm.js',
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
  ]
};
config.defaults = lodash.cloneDeep(config);

module.exports = config;

// #region Load

function load() {
  if (loaded === true)
    return true;
  
  var result = {};

  if (!readArgs())
    return false;
  if (!requireFile(config.filepath, result))
    return false;
  if (!loadConfigValues(result.obj))
    return cli.printErrorAndExit('Invalid config: ' + config.filepath, 99);

  loaded = true;
  
  if (config.verbose)
    cli.printConfig(config, 'Loaded config:');

  return true;
}
config.load = load;

function loadConfigValues(data) {
  var warnings = [];
  
  // priority loaders
  loadConfigVerbosity(data, warnings);
  loadConfigHashids(data, warnings);
  loadConfigLocales(data, warnings);
  loadConfigDirectories(data, warnings);

  // secondary loaders
  loadConfigCss(data, warnings);
  loadConfigDataFile(data, warnings);
  loadConfigTemplates(data, warnings);
  loadConfigWebHost(data, warnings);

  if (printWarnings(warnings))
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
  // salt
  if (istype('String', data.salt))
    config.salt = data.salt;
}

function loadConfigLocales(data) {
  // defaultLocale
  if (istype('String', data.defaultLocale))
    config.defaultLocale = data.defaultLocale;
  // localesdir
  if (istype('String', data.localesdir))
    config.localesdir = data.localesdir;
  config.localesdir = resolvePath(config.localesdir);
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
  if (data.verbose === true)
    config.verbose = true;
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
config.template.reloadGlobals = loadTemplateGlobals;

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
config.getWatchPaths = getWatchPaths;

function resolvePath(to) {
  return path.resolve(config.basedir, to);
}
config.resolvePath = resolvePath;

function resolveSrcPath(to) {
  return path.resolve(config.sourcedir, to);
}
config.resolveSrcPath = resolveSrcPath;

// #endregion

// #region Write

function writeConfig(cfg, to) {
  var result;
  var INDENT = 2;

  cfg = lodash.cloneDeep(cfg || config);
  to = to || cfg.filepath;

  // Delete object data, make absolute paths relative.
  if (cfg.verbose !== true)
    delete cfg.verbose;
  delete cfg.defaults;
  
  cfg.sourcedir = path.relative(cfg.basedir, cfg.sourcedir);
  delete cfg.basedir;
  delete cfg.path;
  
  cfg.data = cfg.datafile;
  delete cfg.datafile;
  
  delete cfg.filepath;
  
  delete cfg.template.globals;
  
  result = JSON.stringify(cfg, null, INDENT);

  fs.writeFileSync(to, result);
}
config.writeConfig = writeConfig;

function writeConfigFile(to) {
  return writeConfig(config, to);
}
config.writeConfigFile = writeConfigFile;

function writeDefaultConfigFile(to) {
  return writeConfig(config.defaults, to || config.filepath);
}
config.writeDefaultConfigFile = writeDefaultConfigFile;

// #endregion

function printWarnings(warnings) {
  var i;
  if (warnings.length < 1)
    return false;
  for (i = 0; i < warnings.length; i++)
    console.warn('Warning: ' + warnings[i]);
  return true;
}

function readArgs() {
  config.path = clargs.path;
  
  if (cli.hasFilePath()) {
    config.filepath = clargs.filepath;
    config.basedir = path.resolve(path.dirname(config.filepath));
  }
  else if (clargs.path !== undefined) {
    config.basedir = path.resolve(config.basedir, clargs.path);
    config.filepath = path.join(config.basedir, config.filename);
  }
  return true;
}

function requireFile(filepath, result) {
  if (filepath === undefined || filepath === null)
    return false;
  try {
    result.obj = requireNew(filepath);
    return true;
  }
  catch (err) {
    if (config.verbose)
      console.log('File not found: ' + filepath);
  }
  return false;
}
config.requireFile = requireFile;
