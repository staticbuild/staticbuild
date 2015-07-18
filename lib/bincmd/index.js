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
    printBuild(build);
  if (build.errors.length > 0) {
    // Failed to load configuration.
    printErrors(build.errors);
    printErrorAndExit('Invalid staticbuild configuration: ' + build.filepath, 1006);
    return;
  }
  if (!chdir(build.basedir))
    return;
  switch (clargs.command) {
    case 'dev':
      runCommand('../devserver/index.js', build, opts || { nodemonEntry: false });
      break;
    case 'setup':
      runCommand('../setup/index.js', build);
      break;
  }
}
module.exports = run;

function runCommand(filepath, build, opts) {
  var cmd = require(filepath);
  if (opts)
    cmd.run(build, opts);
  else
    cmd.run(build);
}

// #region Print

function printBuild(build, header) {
  header = header || 'Loaded staticbuild configuration:';
  console.log(header);
  console.dir(build);
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

function printErrors(errors) {
  var i;
  if (errors.length < 1)
    return false;
  for (i = 0; i < errors.length; i++)
    console.warn('Error: ' + errors[i]);
  return true;
}

// #endregion