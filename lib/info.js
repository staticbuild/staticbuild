'use strict';

// #region Imports
var misc = require('./misc.js');
var os = require('os');
// #endregion

var pkg = require('../package.json');

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
  misc.printLines([
    '',
    'Exit code: ' + (code)
  ]);
  process.exit(code);
}
exports.printErrorAndExit = printErrorAndExit;

function printHelp() {
  printPackageHeader();
  misc.printLines([
    'Syntax: ',
    '',
    '    staticbuild [options | path]',
    '',
    'Options: ',
    '',
    '    --help       -h   Prints this help message.',
    '    --init-default    Writes the default config file to the given path',
    '    --no-restart      Disables the built-in nodemon server restart.',
    '    --restart-delay   Number of seconds to delay nodemon restart when global ',
    '                      script and data files change.',
    '    --verbose    -V   Prints verbose messages.',
    '    --version    -v   Prints version information.',
    '',
    '      path            Path to a staticbuild.json file or directory to find one.',
    '                      If no path is supplied, the current directory is used.',
    ''
  ]);
}
exports.printHelp = printHelp;

function printPackageHeader() {
  misc.printLines([
    'staticbuild: ' + pkg.description + ' (v' + pkg.version + ')',
    ''
  ]);
}
exports.printPackageHeader = printPackageHeader;

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

function printVersion() {
  console.log('staticbuild v' + pkg.version);
}
exports.printVersion = printVersion;