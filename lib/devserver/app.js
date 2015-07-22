'use strict';

// #region Imports
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var lessMw = require('less-middleware');
var lodash = require('lodash');
var logger = require('morgan');
var path = require('path');
var StaticBuild = require('../../index.js');
// #endregion

var app = module.exports = express();
/** The target instance of StaticBuild. */
var build;
/** View Engine */
var veng = {
  jade: undefined,
  nunjucks: undefined
};

/**
 * Initializes the Express app without running it.
 * @param {StaticBuild} [targetBuild] The target build.
 */
function init(targetBuild) {
  // I'd like intellisense for `build` in the rest of this file, so I added 
  // `|| StaticBuild.current` to the next line so I could get it, since VS is 
  // not taking the hint from the jsdoc @param type. So, sue me :) targetBuild
  // is always passed, so it never really gets executed. - waynebloss
  // TODO: Remove the `|| StaticBuild.current` when possible.
  build = targetBuild || StaticBuild.current;
  initViewEngines();
  // Request Pipeline
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
  if (build.verbose)
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

// #region View Engines

function initViewEngines() {
  var relativePathToViews = path.relative(build.basedir, build.sourcedir);
  verbose('relativePathToViews: ' + relativePathToViews);
  
  app.set('views', relativePathToViews);
  app.set('view engine', build.engine[build.defaultEngineName].extension);
  app.locals = createViewContext();
  
  // TODO: Only init Jade and Nunjucks if they're enabled and/or installed.
  // TODO: Add config settings to enable or change the default view engines.
  // CONSIDER: Move jade and nunjucks into npm devDependencies in this project, 
  // forcing the end-developer to install jade and/or nunjucks in their own
  // project.
  // TODO: Support other view engines like consolidate.js does, but with the
  // ability to configure them from the staticbuild.json file.

  initJade();
  initNunjucks();
}

function initJade() {
  veng.jade = require('jade');
  app.engine(build.engine.jade.extension, veng.jade.__express);
}

function initNunjucks() {
  veng.nunjucks = require('nunjucks');
  var options = lodash.cloneDeep(build.engine.nunjucks.options);
  var relativePathToViews = app.get('views');
  options.express = app;
  var nunjucks_env = veng.nunjucks.configure(relativePathToViews, options);
  initNunjucksExtensions(nunjucks_env);
  initNunjucksFilters(nunjucks_env);
  app.engine(build.engine.nunjucks.extension, veng.nunjucks.render);
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

// #endregion

// #region View Routing

function createViewContext() {
  var context = build.context;
  if (build.autocontext) {
    // Add some stuff to the global context.
    if (build.buildvar)
      context[build.buildvar] = build;
    context.t = build.translate;
    context.tn = build.translateNumeric;
  }
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
      console.log('Error: ' + err.toString());
      res.render(viewpath + '.' + build.engine.nunjucks.extension, function (err, html) {
        if (!err)
          res.send(html);
        else if (path.basename(viewpath) === 'index') {
          console.log('Error: ' + err.toString());
          next();
        } else {
          console.log('Error: ' + err.toString());
          renderView(viewpath + '/index', req, res, next);
        }
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
