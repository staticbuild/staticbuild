'use strict';

var fs = require('fs');
var nopt = require('nopt');
var path = require('path');

exports.known = {
  help: Boolean, 
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