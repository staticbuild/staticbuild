/**
* StaticBuild View Context
*
* This is a custom file for your project. Everything exported from here is 
* merged into the default global view context and is available to all views.
*/
'use strict';

var fs = require('fs');
var lodash = require('lodash');
var hljs = require('highlight.js');
var marked = require('marked');

exports.marked = marked;

function highlightJS(js) {
	return hljs.highlight('javascript', js).value;
}
exports.highlightJS = highlightJS;

function readFile(filePath) {
	return fs.readFileSync(filePath, 'utf8');
}
exports.readFile = readFile;

function readJSON(filePath, noCache) {
  if (noCache) {
  	var text = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(text);
  }
  return require(filePath);
}
exports.readJSON = readJSON;
