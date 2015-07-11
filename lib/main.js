'use strict';

process.title = 'staticbuild';

// #region Imports
var cli = require('./cli.js');
var config = require('./config.js');
// #endregion

function run(opts) {
  // Run the command line interface, which may call process.exit in the case
  // of incorrect arguments or after a basic command like help was executed.
  var clargs = cli.run();
  // Load the config specified in the command line args.
  if (!config.load({
    // Required
    path: clargs.path,
    basedir: clargs.basedir,
    filepath: clargs.filepath,
    filename: clargs.filename,
    // Optional
    devmode: clargs.dev === true,
    verbose: clargs.verbose === true,
    restart: clargs.restart === true,
    restartDelay: clargs.restartDelay || 0
  })) {
    // Failed to load configuration.
    printWarnings(config.warnings);
    cli.printErrorAndExit('Invalid config: ' + config.filepath, 99);
    return;
  }
  if (clargs.verbose)
    cli.printConfig(config, 'Loaded config:');
  if (!chdir(config.basedir))
    return;
  if (clargs.dev)
    runCommand('./devserver/index.js', opts || { nodemonEntry: false });
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

function printWarnings(warnings) {
  var i;
  if (warnings.length < 1)
    return false;
  for (i = 0; i < warnings.length; i++)
    console.warn('Warning: ' + warnings[i]);
  return true;
}

function runCommand(filepath, opts) {
  var cmd = require(filepath);
  if (opts)
    cmd.run(opts);
  else
    cmd.run();
}
