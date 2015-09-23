'use strict';

// #region Imports
var Yargs = require('yargs');
// #endregion

var pkg = require('../../package.json');

function run() {
  var cmdArgs, noCmdArgs;

  var yargs = configureYargs()
  .usage(commandUsage('[command]', '[options]', pkg.description))
  .version(titleVersion(), 'v', 'Show version number.')
  .alias('v', 'version')
  .help('h', 'Show help.').alias('h', 'help')
  .command('dev', 'Run the development web server.', function (yargs) {
    cmdArgs = devserver(yargs);
  })
  .command('setup', 'Setup a new project.', function (yargs) {
    cmdArgs = setup(yargs);
  });
  yargs = configureVerbosity(yargs);
  
  // Trigger help or a command function.
  noCmdArgs = processYargs(yargs);
  // If help was triggered, yargs calls process.exit and execution stops here.
  // If a command function was triggered, we have the result in `cmdArgs`.

  var args = cmdArgs || noCmdArgs;
  if (args.verbose) {
    console.log('Using args:');
    console.dir(args);
  }
  if (!args.command) {
    console.error('A command is required.');
    process.exit(1004);
  }
  return args;
}
exports.run = run;

// #region Commands

function devserver(yargs) {
  var requirements = pathRequiredUsage(
    'Path to a staticbuild.json file or directory to find one.\n' +
    '                 If no path is supplied, the current directory is used.');
  
  yargs = configureYargs(yargs)
  .usage(commandUsage('dev', '[options] <path>' + requirements, 
    'Development server.\n\n' + 
    '    Runs a local http server to dynamically render static content during development.'))
  .option('b', {
    alias: 'bundling',
    description: 'Enable bundling.',
    type: 'boolean',
    "default": false
  })
  .option('r', {
    alias: 'restart',
    description: 'Number of seconds to delay nodemon restarts.',
    type: 'number',
    "default": 1
  })
  .describe('no-restart', 'Disables the built-in nodemon server restart.')
  .help('h', 'Show help.').alias('h', 'help');
  yargs = configureVerbosity(yargs);

  var args = processYargs(yargs, 'dev');
  parseDevserverRestart(args);
  pathRequired(args, 1002);
  return args;
}

function setup(yargs) {
  var requirements = pathRequiredUsage(
    'Path for a new staticbuild.json file or project directory.');

  yargs = configureYargs(yargs)
  .usage(commandUsage('setup', '[options] <path>' + requirements, 'Setup.\n\n' + 
    '    Interactive setup to create a new project.'))
  .help('h', 'Show help.').alias('h', 'help');
  yargs = configureVerbosity(yargs);

  var args = processYargs(yargs, 'setup');
  pathRequired(args, 1003);
  return args;
}

// #endregion

// #region Helpers

function commandUsage(command, options, description) {
  return pkg.name + ' v' + pkg.version + ' - ' + description + 
  '\n\nUsage:\n  ' + pkg.name + ' ' + command + ' ' + options;
}

function configureYargs(yargs) {
  yargs = yargs || Yargs;
  return yargs.wrap(null);
}

function configureVerbosity(yargs) {
  return yargs.count('verbose')
  .alias('V', 'verbose')
  .describe('V', 'Enables verbose output.');
}

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

function parseDevserverRestart(args) {
  args.restartDelay = 0;
  // args.restart will be false if the --no-restart flag was used.
  if (args.restart !== false) {
    // if args.restart is not false, it must be a number.
    if (isNaN(args.restart)) {
      console.error('The restart option requires a numeric value.');
      process.exit(1001);
      return;
    }
    // Since args.restart's default of 1/1000ms reflects nodemon's default,
    // we actually don't save it into args.restartDelay. Not sure this is
    // the best place to apply this logic (or if it's needed), but here it is.
    if (args.restart !== 1) // if taking string: && args.restart !== '1000ms')
      args.restartDelay = parseDelay('' + args.restart);
    // Finally, make args.restart the boolean that it always wanted to be.
    args.restart = true;
  }
}

function pathRequired(args, exitCode, message) {
  exitCode = exitCode || 1000;
  message = message || 'A path is required.';
  if (args._.length < 2) {
    console.error(message);
    process.exit(exitCode);
    return;
  }
  args.path = args._[1];
}

function pathRequiredUsage(usageText) {
  var requirements = [
    '\n',
    'Required:',
    '  path           ' + usageText
  ];
  return requirements.join('\n');
}

function processYargs(yargs, command) {
  // The yargs.argv property getter triggers help or a command function :(
  // If help was triggered, yargs calls process.exit and execution stops here
  // and the function never returns.
  var argsObj = yargs.argv;
  if (command)
    argsObj.command = command;
  return argsObj;
}

function titleVersion() {
  return pkg.name + ' v' + pkg.version;
}

// #endregion

// #region Print

function printBuild(build, header) {
  header = header || 'Loaded staticbuild configuration:';
  console.log(header);
  console.dir(build);
}
exports.printBuild = printBuild;

function printErrorAndExit(msg, code) {
  console.log('Fatal error: ' + msg);
  printLines([
    '',
    'Exit code: ' + (code)
  ]);
  process.exit(code);
}
exports.printErrorAndExit = printErrorAndExit;

function printLine(line) {
  console.log(line);
}
exports.printLine = printLine;

function printLines(lines) {
  Array.prototype.forEach.apply(lines, [printLine]);
}
exports.printLines = printLines;

function printErrors(errors) {
  var i;
  if (errors.length < 1)
    return false;
  for (i = 0; i < errors.length; i++)
    console.warn('Error: ' + errors[i]);
  return true;
}
exports.printErrors = printErrors;

// #endregion
