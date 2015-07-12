'use strict';

process.title = 'staticbuild';

// #region Imports
var cli = require('./cli.js');
var config = require('../config.js');
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
    devmode: clargs.command === 'dev',
    verbose: clargs.verbose,
    restart: clargs.restart,
    restartDelay: clargs.restartDelay || 0
  })) {
    // Failed to load configuration.
    printWarnings(config.warnings);
    printErrorAndExit('Invalid config: ' + config.filepath, 1006);
    return;
  }
  if (clargs.verbose)
    printLoadedConfig();
  
  if (!chdir(config.basedir))
    return;

  switch (clargs.command) {
    case 'dev':
      runCommand('../devserver/index.js', opts || { nodemonEntry: false });
      break;
    case 'setup':
      runCommand('../setup/index.js');
      break;
  }
}
module.exports = run;

function chdir(to) {
  try {
    process.chdir(to);
    return true;
  } catch (err) {
    printErrorAndExit('Error "' + err + '" changing to directory: ' + to, 1005);
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

// #region Print

function printLoadedConfig() {
  console.log('Loaded config:');
  console.dir(config);
}

function printErrorAndExit(msg, code) {
  printPackageHeader();
  console.log('Fatal error: ' + msg);
  printLines([
    '',
    'Exit code: ' + (code)
  ]);
  process.exit(code);
}

function printLine(line) {
  console.log(line);
}

function printLines(lines) {
  Array.prototype.forEach.apply(lines, [printLine]);
}

function printWarnings(warnings) {
  var i;
  if (warnings.length < 1)
    return false;
  for (i = 0; i < warnings.length; i++)
    console.warn('Warning: ' + warnings[i]);
  return true;
}

// #endregion