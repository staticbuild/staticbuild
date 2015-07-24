'use strict';

// #region Imports
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var glob = require('glob');
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
  //app.set('view engine', build.engine[build.defaultEngineName].extension);
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
  // TODO: Configure jade `pretty` somewhere else as soon as possible,
  // because polluting locals data is a really bad idea IMO
  // see https://github.com/jadejs/jade/issues/2026
  if (build.engine.jade.options.pretty) {
    app.locals.pretty = true;
  }
  //app.engine(build.engine.jade.extension, veng.jade.__express);
}

function initNunjucks() {
  veng.nunjucks = require('nunjucks');
  var options = lodash.cloneDeep(build.engine.nunjucks.options);
  var relativePathToViews = app.get('views');
  options.express = app;
  var nunjucks_env = veng.nunjucks.configure(relativePathToViews, options);
  initNunjucksExtensions(nunjucks_env);
  initNunjucksFilters(nunjucks_env);
  //app.engine(build.engine.nunjucks.extension, veng.nunjucks.render);
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

// TODO: Instead of using res.render, find the files and render with the
// specific view engine because express is not handling multiple engines well.

// #region View Routing

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

// TODO: Make this function async.
// TODO: Generate pattern file extensions from list of configured engines.
function findView(req) {
  var viewpath = normalizeRequestPath(req.path, 'index');
  // This pattern finds all possible view files.
  var pattern = viewpath + '{/index.,.}+(jade|htm)';
  //
  // See https://github.com/isaacs/node-glob#glob-primer
  // (For the following examples to work, the files must exist.)
  //
  // Given a sourcedir of '/x/y/z' and a viewpath of 'hello':
  // > glob.sync('hello{/index.,.}+(jade|htm)', {cwd: sourcedir, nodir: true});
  // ['hello.jade', 'hello/index.jade']
  // 
  // If the viewpath equals the word 'index':
  // > glob.sync('index{/index.,.}+(jade|htm)', {cwd: sourcedir, nodir: true});
  // ['index.htm', 'index.jade']
  // 
  // If the viewpath is a directory like 'hello/goodbye':
  // > glob.sync('hello/goodbye{/index.,.}+(jade|htm)', {cwd: sourcedir, nodir: true});
  // ['hello/goodbye.jade', 'hello/goodbye/index.jade']
  //
  verbose('Finding views in: ', build.sourcedir, ' with pattern: ', pattern);
  var files = glob.sync(pattern, {
    cwd: build.sourcedir,
    nodir: true
  });
  if (files.length === 0)
    return false;
  req.viewpath = path.join(build.sourcedir, files[0]);
  console.log('Found view: ' + req.viewpath);
  return true;
}

function initViewRouting() {
  app.use(express.static(build.sourcedir));
  app.get('*', renderView);
}

function normalizeRequestPath(reqpath, defaultIfBlank) {
  reqpath = '' + reqpath;
  
  // Remove the leading (or only) slash.
  if (reqpath.charAt(0) === '/')
    reqpath = reqpath.substr(1, reqpath.length - 1);
  
  // Remove any trailing slash.
  if (reqpath.charAt(reqpath.length - 1) === '/')
    reqpath = reqpath.substr(0, reqpath.length - 1);
  
  if (reqpath.length === 0)
    return defaultIfBlank;

  return reqpath;
}

function renderView(req, res, next) {
  if (!findView(req))
    return next();
  var ext = path.extname(req.viewpath).toLowerCase();
  var context = app.locals;
  if (ext === '.jade') {
    veng.jade.renderFile(req.viewpath, context, function (err, html) {
      if (!err)
        return res.send(html);
      return next(err);
    });
  } else if (ext === '.htm') {
    context = lodash.assign({}, context, build.engine.nunjucks.filters);
    veng.nunjucks.render(req.viewpath, context, function (err, html) {
      if (!err)
        return res.send(html);
      return next(err);
    });
  }
}

// #endregion

// #region Error Handling

var errfile = path.resolve(path.join(__dirname, '../../content/error.jade'));

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
  var msg = err.toString();
  console.error(msg);
  err.status = err.status || 500;
  res.status(err.status);
  var html = veng.jade.renderFile(errfile, {
    message: msg,
    error: err
  });
  res.send(html);
}

// #endregion
