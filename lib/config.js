'use strict';

// #region Imports
var cli = require('./cli.js');
var info = require('./info.js');
var istype = require('type-check').typeCheck;
var misc = require('./misc.js');
var path = require('path');
// #endregion

var config = {
  
  verbose: cli.args.verbose === true,

  // #region Directories
  basedir: process.cwd(),
  rootdir: 'site',
  path: process.cwd(),
  // #endregion

  // #region Files
  data: {},
  datafile: 'staticbuild.data.json',
  favicon: 'favicon.ico',
  filename: 'staticbuild.json',
  filepath: '',
  // #endregion
  
  // #region Server
  host: process.env.HOST || undefined,
  port: process.env.PORT || 8080,
  // #endregion
  
  // #region Template
  template: {
    indexfile: 'index',
    engine: 'nunjucks',
    extension: 'htm',
    globals: {},
    globalsfile: 'staticbuild.htm.js',
    localsfile: '*.htm.js',
    options: {
      autoescape: true
    }
  },
  // #endregion
  
  // #region css
  css: {
    map: {
      enabled: true,
      inline: false
    }
  },
  // #endregion

  ignore: [
    '*.layout.htm'
  ]
};
var _def = misc.clone(config);
var _loaded = false;

config.defaults = _def;
module.exports = config;

// #region Load
function load() {
  if (_loaded === true)
    return true;
  return loadConfig();
}
config.load = load;

function loadConfig() {
  var result = {};

  if (!readArgs())
    return false;

  if (readConfig(result))
    if (!loadConfigValues(result))
      info.printErrorAndExit('Invalid config: ' + config.filepath, 99);
  
  if (config.verbose)
    info.printConfig(config, 'Loaded config:');
  
  config.rootdir = resolvePath(config.rootdir);

  readDataFile();
  readGlobalScript();

  _loaded = true;
  return true;
}

function loadConfigValues(result) {
  var val = result.data;
  var tpl, css;
  
  // verbose
  // - Can only be turned ON from config, not off.
  if (val.verbose === true)
    config.verbose = true;
  
  // data | datafile
  if (istype('String', val.data))
    config.datafile = val.data;
  else if (istype('String', val.datafile))
    config.datafile = val.datafile;
  else if (istype('Object', val.data)) {
    config.datafile = null;
    config.data = val.data;
  }
  
  // host
  if (istype('String', val.host))
    config.host = val.host;
  // port
  if (istype('Number', val.port))
    config.port = val.port;
  
  // root | rootdir
  if (istype('String', val.rootdir))
      config.rootdir = val.rootdir;
  else if (istype('String', val.root))
    config.rootdir = val.root;

  // template
  tpl = val.template;
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
    
    // globals | globalfiles
    if (istype('String', tpl.globals))
      config.template.globalsfile = tpl.globals;
    else if (istype('String', tpl.globalsfile))
      config.template.globalsfile = tpl.globalsfile;

    // locals | localsfile
    if (istype('String', tpl.locals))
      config.template.localsfile = tpl.locals;
    else if (istype('String', tpl.localsfile))
        config.template.localsfile = tpl.localsfile;
    
    // options
    // CONSIDER: Overwriting all config.template.options here.
    if (istype('Object', tpl.options))
      config.template.options = tpl.options;
  }
  // css
  css = val.css;
  if (istype('Object', css)) {
    if (istype('Object', css.map)) {
      // enabled
      if (istype('Boolean', css.map.enabled))
        config.css.map.enabled = css.map.enabled === true;
      // inline
      if (istype('Boolean', css.map.inline))
        config.css.map.inline = css.map.inline === true;
    }
  }
  return true;
}
// #endregion

// #region Read
function readArgs() {
  var args = cli.args;
  
  config.path = args.path;
  
  if (cli.hasFilePath()) {
    config.filepath = args.filepath;
    config.basedir = path.resolve(path.dirname(config.filepath));
  }
  else if (args.path !== undefined) {
    config.basedir = path.resolve(config.basedir, args.path);
    config.filepath = path.join(config.basedir, config.filename);
  }
  return true;
}

function readConfig(result) {
  try {
    result.data = require(config.filepath);
    return true;
  }
  catch (err) {
    if (config.verbose)
      console.log('File not found: ' + config.filepath);
  }
  return false;
}

function readDataFile() {
  var rpath;
  if (config.datafile === null || config.datafile === undefined)
    return false;
  try {
    rpath = resolvePath(config.datafile);
    config.data = require(rpath);
    return true;
  }
  catch (err) {
  }
  return false;
}

function readGlobalScript() {
  var tpl, rpath;
  try {
    tpl = config.template;
    rpath = resolvePath(tpl.globalsfile);
    tpl.globals = require(rpath);
    return true;
  }
  catch (err) {
  }
  return false;
}
// #endregion

function resolvePath(to) {
  return path.resolve(config.basedir, to);
}
config.resolvePath = resolvePath;

function resolveSitePath(to) {
  return path.resolve(config.rootdir, to);
}
config.resolveSitePath = resolveSitePath;