'use strict';

process.title = 'staticbuild';

// #region Imports
var cli = require('./cli.js');
var config = require('./config.js');
// #endregion

function run(opts) {
  var clargs = cli.run();
  opts = opts || {
    nodemonEntry: false
  };
  if (!config.load())
    return;
  if (!chdir(config.basedir))
    return;
  if (clargs.dev)
    runCommand('./devserver/index.js', opts);
  else if (clargs.setup)
    runCommand('./setup/index.js');
}
module.exports = run;

function chdir(to) {
  try {
    process.chdir(to);
    return true;
  } catch (err) {
    cli.printErrorAndExit('Error "' + err + '" changing to directory: ' + to, 1005);
  }
  return false;
}

function runCommand(filepath, opts) {
  var cmd = require(filepath);
  if (opts)
    cmd.run(opts);
  else
    cmd.run();
}
