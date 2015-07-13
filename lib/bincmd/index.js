'use strict';

process.title = 'staticbuild';

// #region Imports
var cli = require('./cli.js');
var StaticBuild = require('../../index.js');
// #endregion

function chdir(dirpath) {
  try {
    process.chdir(dirpath);
    return true;
  } catch (err) {
    printErrorAndExit('Error "' + err + '" changing to directory: ' + dirpath, 1005);
  }
  return false;
}

function run(opts) {
  // Run the command line interface, which may call process.exit in the case
  // of incorrect arguments or after a basic command like help was executed.
  var clargs = cli.run();
  // Load the config specified in the command line args.
  var build = new StaticBuild(clargs.path, {
    devmode: clargs.command === 'dev',
    verbose: clargs.verbose,
    restart: clargs.restart,
    restartDelay: clargs.restartDelay || 0
  });
  if (clargs.verbose)
    printConfig(config);
  if (config.warnings.length > 0) {
    // Failed to load configuration.
    printWarnings(config.warnings);
    printErrorAndExit('Invalid config: ' + config.filepath, 1006);
    return;
  }
  if (!chdir(config.basedir))
    return;
  switch (clargs.command) {
    case 'dev':
      runCommand('../devserver/index.js', config, opts || { nodemonEntry: false });
      break;
    case 'setup':
      runCommand('../setup/index.js', config);
      break;
  }
}
module.exports = run;

function runCommand(filepath, config, opts) {
  var cmd = require(filepath);
  if (opts)
    cmd.run(config, opts);
  else
    cmd.run(config);
}

// #region Print

function printConfig(config, header) {
  header = header || 'Loaded config:';
  console.log(header);
  console.dir(config);
}

function printErrorAndExit(msg, code) {
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