'use strict';

// #region Imports
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var glob = require('glob');
var lessMw = require('less-mw');
var lodash = require('lodash');
var logger = require('morgan');
var path = require('path');
var StaticBuild = require('../../index.js');
// #endregion

var app = module.exports = express();
/** The target instance of StaticBuild. */
var build;
/** View Engine Modules */
var veng = {
  jade: undefined,
  nunjucks: undefined
};
/** View Renderer Functions */
var vrend = {};

/**
 * Initializes the Express app without running it.
 * @param {StaticBuild} [targetBuild] The target build.
 */
function init(targetBuild) {
  // CONSIDER: The `|| StaticBuild.current` isn't really necessary.
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
      sourceMapBasepath: build.sourceDir,
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
  app.use(lessMw(build.sourceDir, opt));
}
initCssLESS.SOURCEMAP_REQUESTPATH_TOKEN = '___req.path___';
initCssLESS.SOURCEMAP_FILENAME_TOKEN = 
  initCssLESS.SOURCEMAP_REQUESTPATH_TOKEN + '.map';

function postprocessCss(css, req) {
  if (css && css.replace)
    css = css.replace(initCssLESS.SOURCEMAP_REQUESTPATH_TOKEN, req.path);
  return css;
}

// #endregion

// #region View Engines

function initViewEngines() {
  var relativePathToViews = path.relative(build.baseDir, build.sourceDir);
  verbose('relativePathToViews: ' + relativePathToViews);
  
  app.set('views', relativePathToViews);
  app.locals = build.context;

  var eng = build.engine.jade;
  if (eng && eng.extension)
    vrend['.' + eng.extension] = renderJade;
  eng = build.engine.nunjucks;
  if (eng && eng.extension)
    vrend['.' + eng.extension] = renderNunjucks;
}

function initJade() {
  veng.jade = require('jade');
  // CONSIDER: I'd like to configure jade `pretty` somewhere else;
  // polluting locals data is a bad idea IMO. See the following issue for a
  // Express 3 workaround - https://github.com/jadejs/jade/issues/2026
  // (We're using Express 4 here so the solution in the comments there
  // probably won't work. Haven't tried it yet.)
  if (build.engine.jade.options.pretty) {
    app.locals.pretty = true;
  }
}

function initNunjucks() {
  veng.nunjucks = require('nunjucks');
  var options = lodash.cloneDeep(build.engine.nunjucks.options);
  var relativePathToViews = app.get('views');
  options.express = app;
  var nunjucks_env = veng.nunjucks.configure(relativePathToViews, options);
  initNunjucksExtensions(nunjucks_env);
  initNunjucksFilters(nunjucks_env);
}

function initNunjucksExtensions(nunjucks_env) {
  var collection = build.engine.nunjucks.extensions;
  if (collection === undefined || collection === null)
    return;
  /*jshint -W089 */
  for (var name in collection)
    nunjucks_env.addExtension(name, collection[name]);
}

function initNunjucksFilters(nunjucks_env) {
  var collection = build.engine.nunjucks.filters;
  if (collection === undefined || collection === null)
    return;
  /*jshint -W089 */
  for (var name in collection)
    nunjucks_env.addFilter(name, collection[name]);
}

function renderJade(req, res, next) {
  if (!veng.jade)
    initJade();
  var context = app.locals;
  veng.jade.renderFile(req.viewpath, context, function (err, html) {
    if (!err)
      return res.send(html);
    return next(err);
  });
}

function renderNunjucks(req, res, next) {
  if (!veng.nunjucks)
    initNunjucks();
  var context = lodash.assign({}, app.locals, build.engine.nunjucks.functions);
  veng.nunjucks.render(req.viewpath, context, function (err, html) {
    if (!err)
      return res.send(html);
    return next(err);
  });
}

// #endregion

// #endregion

// #region View Routing

// TODO: Make findView async.
// TODO: Generate findView pattern file extensions from configured engines.
function findView(req) {
  var viewpath = normalizeRequestPath(req.path, 'index');
  // This pattern finds all possible view files.
  var pattern = viewpath + '{/index.,.}+(jade|htm)';
  // #region How it works
  // See https://github.com/isaacs/node-glob#glob-primer
  // (For the following examples to work, the files must exist.)
  //
  // Given a sourceDir of '/x/y/z' and a viewpath of 'hello':
  // > glob.sync('hello{/index.,.}+(jade|htm)', {cwd: sourceDir, nodir: true});
  // ['hello.jade', 'hello/index.jade']
  // 
  // If the viewpath equals the word 'index':
  // > glob.sync('index{/index.,.}+(jade|htm)', {cwd: sourceDir, nodir: true});
  // ['index.htm', 'index.jade']
  // 
  // If the viewpath is a directory like 'hello/goodbye':
  // > glob.sync('hello/goodbye{/index.,.}+(jade|htm)', 
  //     { cwd: sourceDir, nodir: true});
  // ['hello/goodbye.jade', 'hello/goodbye/index.jade']
  // #endregion
  verbose('Finding views in: ', build.sourceDir, ' with pattern: ', pattern);
  var files = glob.sync(pattern, {
    cwd: build.sourceDir,
    nodir: true
  });
  if (files.length === 0)
    return false;
  req.viewpath = path.join(build.sourceDir, files[0]);
  console.log('Found view: ' + req.viewpath);
  return true;
}

function initViewRouting() {
  app.use(express.static(build.sourceDir));
  if (build.verbose)
    console.log('Mapping paths');
  lodash.forEach(build.pathMap, function (mapping, name, pathMap) {
    if (build.verbose)
      console.log('  - ' + name + 
        ': from "' + mapping.fs + 
        '" to "' + mapping.url + '"');
    app.use(mapping.url, express.static(mapping.fs));
  });
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
  if (ext in vrend) {
    // TODO: If there is a .view.js file that matches req.viewpath, load it into
    // req.locals and then use that as the context in each render function.
    vrend[ext](req, res, next);
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
