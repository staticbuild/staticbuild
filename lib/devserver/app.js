'use strict';

// #region Imports
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var jade = require('jade');
var lessMw = require('less-middleware');
var lodash = require('lodash');
var logger = require('morgan');
var nunjucks = require('nunjucks');
var path = require('path');
var StaticBuild = require('../../index.js');
// #endregion

var app = express();
var build;

module.exports = app;

function init(targetBuild) {
  
  build = targetBuild || StaticBuild.current;
  
  initViewEngine();
  
  // Request Pipeline Setup
  // - be mindful of the order of the these calls.
  initFavicon();
  initLogging();
  initParsing();
  initCssLESS();
  initViewRouting();
  initErrorHandling();
  
}
app.init = init;

function verbose(data) {
  /*jshint unused:false*/
  if (build.verbose === true)
    console.log.apply(console, arguments);
}

// #region Features

function initFavicon() {
  app.use(favicon(build.resolveSrcPath(build.favicon)));
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

// #region CSS/LESS

function initCssLESS() {
  // Options for less-middleware.
  var opt = {
    debug: false,
    render: {
      compress: false
    }
  };
  var sm;
  if (build.engine.less.map.enabled === true) {
    // Less-middleware passes opt.render data to the less.render function.
    opt.render.sourceMap = sm = {
      sourceMapBasepath: build.sourcedir,
      sourceMapRootpath: '/'
    };
    if (build.engine.less.map.inline === true) {
      // BUG: External map files are still created, even when inline is enabled.
      sm.sourceMapFileInline = true;
      sm.sourceMapLessInline = true;
      sm.sourceMapMapInline = true;
      sm.outputSourceFiles = true;
    } else {
      // HACK: Specifying sourceMapFilename here causes less to put the same
      // sourceMappingURL in every css file, so instead we use a special token
      // and fix the situation during postprocess.css.
      sm.sourceMapFilename = initCssLESS.SOURCEMAP_FILENAME_TOKEN;
      opt.postprocess = {
        css: postprocessCss
      };
    }
  }
  app.use(lessMw(build.sourcedir, opt));
}
initCssLESS.SOURCEMAP_REQUESTPATH_TOKEN = '___req.path___';
initCssLESS.SOURCEMAP_FILENAME_TOKEN = initCssLESS.SOURCEMAP_REQUESTPATH_TOKEN + '.map';

function postprocessCss(css, req) {
  if (css && css.replace)
    css = css.replace(initCssLESS.SOURCEMAP_REQUESTPATH_TOKEN, req.path);
  return css;
}

// #endregion

// #region View Engine

function initViewEngine() {
  var relativePathToViews = path.relative(build.basedir, build.sourcedir);
  verbose('relativePathToViews: ' + relativePathToViews);

  app.set('views', relativePathToViews);
  app.set('view engine', build.engine[build.defaultEngineName].extension);
  app.locals = createViewContext();

  initNunjucks();

  app.engine(build.engine.jade.extension, jade.__express);
  app.engine(build.engine.nunjucks.extension, nunjucks.render);
}

function initNunjucks() {
  var options = lodash.cloneDeep(build.engine.nunjucks.options);
  var relativePathToViews = app.get('views');
  options.express = app;
  var nunjucks_env = nunjucks.configure(relativePathToViews, options);
  initNunjucksExtensions(nunjucks_env);
  initNunjucksFilters(nunjucks_env);
  return nunjucks_env;
}

function initNunjucksExtensions(nunjucks_env) {
  var collection = build.engine.nunjucks.extensions;
  if (collection === undefined || collection === null)
    return;
  /*jshint -W089 */
  // https://jslinterrors.com/the-body-of-a-for-in-should-be-wrapped-in-an-if-statement
  for (var name in collection)
    nunjucks_env.addExtension(name, collection[name]);
}

function initNunjucksFilters(nunjucks_env) {
  var collection = build.engine.nunjucks.filters;
  if (collection === undefined || collection === null)
    return;
  /*jshint -W089 */
  // https://jslinterrors.com/the-body-of-a-for-in-should-be-wrapped-in-an-if-statement
  for (var name in collection)
    nunjucks_env.addFilter(name, collection[name]);
}

// #endregion

// #region View Routing

function createViewContext() {
  var context = build.context;
  if (build.buildvar)
    context[build.buildvar] = build;
  return context;
}

function normalizeViewPath(viewpath) {
  viewpath = '' + viewpath;
  
  // Remove the leading (or only) slash.
  if (viewpath.charAt(0) === '/')
    viewpath = viewpath.substr(1, viewpath.length - 1);
  
  // Remove any trailing slash.
  if (viewpath.charAt(viewpath.length - 1) === '/')
    viewpath = viewpath.substr(0, viewpath.length - 1);

  return viewpath;
}

function initViewRouting() {
  app.use(express.static(build.sourcedir));
  app.get('*', routeToView);
}

function routeToView(req, res, next) {
  var viewpath = normalizeViewPath(req.path);
  var ext = path.extname(viewpath);
  if (ext) {
    res.render(viewpath);
    return;
  }
  if (viewpath.length === 0)
    viewpath = 'index';
  renderView(viewpath, req, res, next);
}

function renderView(viewpath, req, res, next) {
  res.render(viewpath + '.' + build.engine.jade.extension, function (err, html) {
    if (!err)
      res.send(html);
    else {
      res.render(viewpath + '.' + build.engine.nunjucks.extension, function (err, html) {
        if (!err)
          res.send(html);
        else if (path.basename(viewpath) === 'index') {
          next();
        } else 
          renderView(viewpath + '/index', req, res, next);
      });
    }
  });
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
