'use strict';

var fs = require('fs');
var nopt = require('nopt');
var path = require('path');

exports.known = {
  help: Boolean, 
  "init-default": Boolean,
  restart: Boolean,
  "restart-delay": String,
  verbose: Boolean,
  version: Boolean,
  path: path
};

exports.aliases = {
  h: '--help', 
  v: '--version',
  V: '--verbose'
};

var args = nopt(exports.known, exports.aliases, process.argv, 2);
var remain = args.argv.remain;
if (remain && remain.length > 0) {
  args.path = remain[0];
}

/** True if a staticbuild.json file with default values should be created. Defaults to false. */
args.initDefault = args["init-default"];
/** Whether to use nodemon to watch files and restart. Defaults to true. */
args.restart = (args.restart !== false);
/** Number of seconds to delay a restart. Defaults to 0. */
args.restartDelay = parseDelay(args["restart-delay"] || '0');

exports.args = args;

function hasFilePath() {
  if (args.filepath !== undefined)
    return true;
  if (args.path === undefined)
    return false;
  try {
    var stat = fs.statSync(args.path);
    if (stat.isFile()) {
      args.filepath = path.resolve(args.path);
      return true;
    }
  } catch (err) {
  }
  return false;
}
exports.hasFilePath = hasFilePath;

// copied from https://github.com/remy/nodemon/blob/master/lib/cli/parse.js
/**
 * Given an argument (ie. from nodemonOption()), will parse and return the
 * equivalent millisecond value or 0 if the argument cannot be parsed
 *
 * @param {String} argument value given to the --delay option
 * @return {Number} millisecond equivalent of the argument
 */
function parseDelay(value) {
  var millisPerSecond = 1000;
  var millis = 0;
  
  if (value.match(/^\d*ms$/)) {
    // Explicitly parse for milliseconds when using ms time specifier
    millis = parseInt(value, 10);
  } else {
    // Otherwise, parse for seconds, with or without time specifier, then convert
    millis = parseFloat(value) * millisPerSecond;
  }
  
  return isNaN(millis) ? 0 : millis;
}