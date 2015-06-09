'use strict';

// #region Imports
var config = require('./config.js');
var fs = require('fs');
var misc = require('./misc.js');
var nunjucks = require('nunjucks');
var parseurl = require('parseurl');
var path = require('path');
// #endregion

var app = {
  views: '',
  viewFileExtension: 'htm'
};
var context;

module.exports = app;

function run() {
  initViewEngine();
}
app.run = run;

// #region View Engine

function initViewEngine() {
  app.views = config.resolvePath(config.sourcedir);
  app.viewFileExtension = config.template.extension;
  initNunjucks();
}

function initNunjucks() {
  var options = misc.copy(config.template.options);
  var views = app.views;
  var env = nunjucks.configure(views, options);
  initNunjucksFilters(env);
  initNunjucksContext(env);
}

function initNunjucksContext(env) {
  var g = config.template.globals;
  context = misc.clone(config.data);
  if (g !== undefined)
    misc.copy(g.functions, context);
}

function initNunjucksFilters(env) {
  var filterName;
  var filters;
  var g = config.template.globals;
  if (g !== undefined)
    filters = g.filters;
  if (filters === undefined)
    return;
  for (filterName in filters)
    env.addFilter(filterName, filters[filterName]);
}

// #endregion
