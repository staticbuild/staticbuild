'use strict';

// #region Imports
var express = require('express');
var favicon = require('serve-favicon');
var glob = require('glob');
var lodash = require('lodash');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMw = require('less-middleware');
var nunjucks = require('nunjucks');
var path = require('path');
// #endregion

var staticbuild = require('../../index.js');

var app = express();
var view_env;

module.exports = app;

function init() {
  
  initViewEngine();
  
  // Request Pipeline Setup
  // - be mindful of the order of the these calls.
  initFavicon();
  initLogging();
  initParsing();
  initCssPreproc();
  initViewRouting();
  initErrorHandling();

}
app.init = init;

function verbose(data) {
  /*jshint unused:false*/
  if (config.verbose === true)
    console.log.apply(console, arguments);
}

// #region Features

function initFavicon() {
  app.use(favicon(staticbuild.resolveSrcPath(config.favicon)));
}

function initLogging() {
  app.use(logger('dev'));
}

function initParsing() {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
}

// #endregion

// #region CSS

function initCssPreproc() {
  if (config.css.preprocessor !== 'less')
    throw new Error('Unsupported CSS preprocessor: ' + config.css.preprocessor);
  initCssLess();
}

function initCssLess() {
  // Options for less-middleware.
  var opt = {
    debug: false,
    render: {
      compress: false
    }
  };
  var sm;
  if (config.css.map.enabled === true) {
    // Less-middleware passes opt.render data to the less.render function.
    opt.render.sourceMap = sm = {
      sourceMapBasepath: config.sourcedir,
      sourceMapRootpath: '/'
    };
    if (config.css.map.inline === true) {
      // BUG: External map files are still created, even when inline is enabled.
      sm.sourceMapFileInline = true;
      sm.sourceMapLessInline = true;
      sm.sourceMapMapInline = true;
      sm.outputSourceFiles = true;
    } else {
      // HACK: Specifying sourceMapFilename here causes less to put the same
      // sourceMappingURL in every css file, so instead we use a special token
      // and fix the situation during postprocess.css.
      sm.sourceMapFilename = initCssLess.SOURCEMAP_FILENAME_TOKEN;
      opt.postprocess = {
        css: postprocessCss
      };
    }
  }
  app.use(lessMw(config.sourcedir, opt));
}
initCssLess.SOURCEMAP_REQUESTPATH_TOKEN = '___req.path___';
initCssLess.SOURCEMAP_FILENAME_TOKEN = initCssLess.SOURCEMAP_REQUESTPATH_TOKEN + '.map';

function postprocessCss(css, req) {
  if (css && css.replace)
    css = css.replace(initCssLess.SOURCEMAP_REQUESTPATH_TOKEN, req.path);
  return css;
}

// #endregion

// #region View Engine

function initViewEngine() {
  var relativePathToViews = path.relative(config.basedir, config.sourcedir);
  verbose('relativePathToViews: ' + relativePathToViews);

  app.set('views', relativePathToViews);
  app.set('view engine', config.template.extension);

  if (config.template.engine !== 'nunjucks')
    throw new Error('Unsupported view engine: ' + config.template.engine);
  initNunjucks();
}

function initNunjucks() {
  var options = lodash.cloneDeep(config.template.options);
  var relativePathToViews = app.get('views');
  options.express = app;
  view_env = nunjucks.configure(relativePathToViews, options);
  initNunjucksExtensions();
  initNunjucksFilters();
}

function initNunjucksExtensions() {
  var name;
  var collection;
  var g = config.template.globals;
  if (g !== undefined)
    collection = g.extensions;
  if (collection === undefined || collection === null)
    return;
  /*jshint -W089 */
  // https://jslinterrors.com/the-body-of-a-for-in-should-be-wrapped-in-an-if-statement
  for (name in collection)
    view_env.addExtension(name, collection[name]);
}

function initNunjucksFilters() {
  var name;
  var collection;
  var g = config.template.globals;
  if (g !== undefined)
    collection = g.filters;
  if (collection === undefined || collection === null)
    return;
  /*jshint -W089 */
  // https://jslinterrors.com/the-body-of-a-for-in-should-be-wrapped-in-an-if-statement
  for (name in collection)
    view_env.addFilter(name, collection[name]);
}

// #endregion

// #region View Routing

function initViewRouting() {
  app.use(express.static(config.sourcedir));
  app.use(routeToViewFile);
  app.use(routeToViewDir);
}

function createViewContext() {
  var context = {};
  var g = config.template.globals;
  lodash.assign(context, config.data);
  lodash.assign(context, g.functions);
  return context;
}

function getViewContext(req) {
  req.viewContext = 
    req.viewContext || 
    createViewContext();
  return req.viewContext;
}

function renderView(viewpath, req, res, next) {
  verbose('req.path: ' + req.path);
  verbose('viewpath: ' + viewpath);
  var context = getViewContext(req);
  if (config.template.localsfile)
    assignLocals(viewpath, context, req);
  nunjucks.render(viewpath, context, function(err, html) {
    var msg;
    if (err) {
      msg = '' + (err.message || err);
      verbose('Error routing view ' + viewpath + ': ' + msg);
      if (msg.indexOf('template not found') < 0)
        return next(err);
      // Let the 404 handler get it by NOT passing err to next.
      return next();
    }
    res.send(html);
  });
}

function routeToViewDir(req, res, next) {
  var tpl = config.template;
  var viewpath = getViewPath(req.path) +
    '/' + tpl.indexfile + 
    '.' + tpl.extension;
  renderView(viewpath, req, res, next);
}

function routeToViewFile(req, res, next) {
  var tpl = config.template;
  var viewpath = getViewPath(req.path) + 
    '.' + tpl.extension;
  renderView(viewpath, req, res, next);
}

function getViewPath(reqpath) {
  var viewpath = '' + reqpath;
  var tpl = config.template;
  
  // Remove the leading (or only) slash.
  if (viewpath === '/')
    viewpath = tpl.indexfile;
  else if (viewpath.charAt(0) === '/')
    viewpath = viewpath.substr(1, viewpath.length - 1);
  
  // Remove any trailing slash.
  if (viewpath.charAt(viewpath.length - 1) === '/')
    viewpath = viewpath.substr(0, viewpath.length - 1);

  return viewpath;
}

function assignLocals(viewpath, context, req) {
  if (req.assignedLocals === true)
    return;
  var found = findLocalsFiles(viewpath);
  var files = found.files;
  var i, fullpath, result;
  verbose('Found:', files.length, 'locals files.');
  for (i = 0; i < files.length; i++) {
    fullpath = path.resolve(found.searchpath, files[i]);
    verbose('Using locals file:', files[i], 'fullpath:', fullpath);
    result = {};
    if (!staticbuild.tryRequireNew(fullpath, result))
      continue;
    lodash.assign(context, result.obj);
    req.assignedLocals = true;
  }
}

function findLocalsFiles(viewpath) {
  var fullpath = path.resolve(config.sourcedir, viewpath);
  var searchpath = path.dirname(fullpath);
  var parsedpath = path.parse(fullpath);
  var pattern = String.prototype.replace.apply(config.template.localsfile, [
    '<filename>', parsedpath.base]);
  pattern = String.prototype.replace.apply(pattern, [
    '<filename_noext>', parsedpath.name]);
  verbose('Searching for locals with pattern:', pattern, 'in:', searchpath);
  var options = {
    cwd: searchpath,
    nodir: true
  };
  return {
    files: glob.sync(pattern, options),
    fullpath: fullpath,
    parsedpath: parsedpath,
    searchpath: searchpath
  };
}

// #endregion

// #region Error Handling

function initErrorHandling() {
  app.use(error404Handler);
  app.use(errorHandler);
}

function error404Handler(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  /*jshint unused:false*/
  var 
    msg = 'ERROR: ' + err.message;
  console.error(err);
  res.status(err.status || 500);
  res.render('error', {
    message: msg,
    error: err
  });
}

// #endregion
