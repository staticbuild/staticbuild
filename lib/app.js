'use strict';

// #region Imports
var config = require('./config.js');
var express = require('express');
var favicon = require('serve-favicon');
var fs = require('fs');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMw = require('less-middleware');
var misc = require('./misc.js');
var nunjucks = require('nunjucks');
var parseurl = require('parseurl');
var path = require('path');
// #endregion

var app = express();
var context;

module.exports = app;

function init() {
  
  initViewEngine();
  
  // Handler initializers
  // - be mindful of the order of the these calls.
  initFavicon();
  initLogging();
  initParsing();
  initCssLess();
  initRouting();
  initErrorHandling();

}
app.init = init;

// #region View Engine

function initViewEngine() {
  app.set('views', config.resolvePath(config.sourcedir));
  app.set('view engine', config.template.extension);
  if (config.template.engine !== 'nunjucks')
    throw new Error('Unsupported view engine: ' + config.template.engine);
  initNunjucks();
}

function initNunjucks() {
  var tpl = config.template;
  var g = tpl.globals;
  var options = misc.copy(tpl.options);
  var views = app.get('views');
  var env;

  options.express = app;
  env = nunjucks.configure(views, options);

  if (g !== undefined) {
    initNunjucksFilters(env, g.filters);
  }
  initNunjucksContext(env);
}

function initNunjucksContext(env) {
  var g = config.template.globals;
  context = misc.clone(config.data);
  if (g !== undefined)
    misc.copy(g.functions, context);
}

function initNunjucksFilters(env, filters) {
  var filterName;
  if (filters === undefined)
    return;
  for (filterName in filters)
    env.addFilter(filterName, filters[filterName]);
}

// #endregion

// #region Features

function initFavicon() {
  app.use(favicon(config.resolvePath(config.favicon)));
}

function initLogging() {
  app.use(logger('dev'));
}

function initParsing() {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
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
  app.use(lessMw(config.resolvePath(config.sourcedir), opt));
}
initCssLess.SOURCEMAP_REQUESTPATH_TOKEN = '___req.path___';
initCssLess.SOURCEMAP_FILENAME_TOKEN = initCssLess.SOURCEMAP_REQUESTPATH_TOKEN + '.map';

function postprocessCss(css, req) {
  if (css && css.replace)
    css = css.replace(initCssLess.SOURCEMAP_REQUESTPATH_TOKEN, req.path);
  return css;
}

// #endregion

// #region Routing

function initRouting() {
  // TODO: Replace stylus with less.
  //app.use(require('stylus').middleware(path.join(__dirname, 'public')));
  
  app.use(express.static(config.resolvePath(config.sourcedir)));
  app.use(routeToView);
}

function viewExists(req) {
  var purl = parseurl(req);
  var pathname = '' + purl.pathname;
  var filepath = '';
  var i = pathname.length;
  
  if (i === 0)
    return false;
  
  i = pathname.length - 1;
  if (pathname.charAt(i) === '/')
    pathname = pathname.substring(0, i - 1);
  if (pathname.length === 0)
    pathname = config.template.indexfile;
  
  filepath = path.join(config.resolvePath(config.sourcedir), pathname);
  if (fs.existsSync(filepath))
    return true;
  if (fs.existsSync(filepath + '.htm'))
    return true;
  
  return false;
}

function routeToView(req, res, next) {
  var purl = parseurl(req);
  var pathname = '' + purl.pathname;
  if (pathname === '/')
    pathname = '/' + config.template.indexfile;
  res.render(pathname, context, function(err, html) {
    if (err) {
      if ((err.message + '').substring(0, 18) === 'template not found') {
        if (config.verbose)
          console.log('Template not found: ' + pathname);
        // Let the 404 handler get it by NOT passing err to next.
        return next();
      }
      return next(err);
    }
    res.send(html);
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
  var 
    msg = 'ERROR: ' + err.message;
  res.status(err.status || 500);
  res.render('error', {
    message: msg,
    error: err
  });
}

// #endregion
