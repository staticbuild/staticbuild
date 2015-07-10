'use strict';

// #region Imports
var fs = require('fs');
var os = require('os');
var path = require('path');
var Yargs = require('yargs');
// #endregion

var pkg = require('../package.json');
var args;

function main() {
  var yargs = configureYargs()
  .usage(commandUsage('[command]', '[options]', pkg.description))
  .version(titleVersion(), 'v', 'Show version number.')
  .alias('v', 'version')
  .help('h', 'Show help.').alias('h', 'help')
  .command('dev', 'Run the development web server.', devserver)
  .command('setup', 'Setup a new project.', setup);
  
  yargs = configureVerbosity(yargs);

  // Trigger help or a command function.
  var argsMissingCmd = processYargs(yargs);
  // If help was triggered, yargs calls process.exit and execution stops here.
  // If a command function was triggered, the command function should have
  // set the module-level `args` variable and it's `command` property.
  args = args || argsMissingCmd;
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

// #region Commands

function devserver(yargs) {
  var requirements = pathRequired(
    'Path to a staticbuild.json file or directory to find one.\n' +
    '                 If no path is supplied, the current directory is used.');
  
  var yargs = configureYargs(yargs)
  .usage(commandUsage('dev', '[options] <path>' + requirements, 
    'Development server.\n\n' + 
    '    Runs a local http server to dynamically render static content during development.'))
  .option('r', {
    alias: 'restart',
    description: 'Number of seconds to delay nodemon restarts.',
    type: 'number',
    "default": 1
  })
  .describe('no-restart', 'Disables the built-in nodemon server restart.')
  .help('h', 'Show help.').alias('h', 'help');
  
  yargs = configureVerbosity(yargs);
  args = processYargs(yargs, 'dev');
  args.dev = true;

  // restart
  if (args.restart === false) {
    args.restartDelay = 0;
  } else {
    if (isNaN(args.restart)) {
      console.error('The restart option requires a numeric value.');
      process.exit(1001);
      return;
    }
    if (args.restart !== 1)
      args.restartDelay = parseDelay('' + args.restart);
    args.restart = true;
  }
  // path
  if (args._.length < 2) {
    console.error('A path is required.');
    process.exit(1002);
    return;
  }
  args.path = args._[1];
}

function setup(yargs) {
  var requirements = pathRequired(
    'Path for a new staticbuild.json file or project directory.');

  var yargs = configureYargs(yargs)
  .usage(commandUsage('setup', '[options] <path>' + requirements, 'Setup.\n\n' + 
    '    Interactive setup to create a new project.'))
  .help('h', 'Show help.').alias('h', 'help');
  
  yargs = configureVerbosity(yargs);
  args = processYargs(yargs, 'setup');
  args.setup = true;
  
  // path
  if (args._.length < 2) {
    console.error('A path is required.');
    process.exit(1003);
    return;
  }
  args.path = args._[1];
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

function pathRequired(usageText) {
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

function printConfig(config, header) {
  if (header === undefined)
    header = 'Config:';
  console.log(header);
  console.dir(config);
}
exports.printConfig = printConfig;

function printErrorAndExit(msg, code) {
  printPackageHeader();
  console.log('Fatal error: ' + msg);
  printLines([
    '',
    'Exit code: ' + (code)
  ]);
  process.exit(code);
}
exports.printErrorAndExit = printErrorAndExit;

function printStatusListening(config, port) {
  var host = config.host || 'localhost';
  var msg = 'staticbuild development server listening @ ' + 
    host + ':' + 
    port + '.';
  console.log(msg);
  if (config.restart)
    console.log('To restart, enter command: rs');
  if (os.platform() === 'darwin')
    console.log('Press Cmd + C to exit.');
  else
    console.log('Press Ctrl + C to exit.');
}
exports.printStatusListening = printStatusListening;

function printLine(line) {
  console.log(line);
}
exports.printLine = printLine;

function printLines(lines) {
  Array.prototype.forEach.apply(lines, [exports.printLine]);
}
exports.printLines = printLines;

exports.args = main();

// #endregion
