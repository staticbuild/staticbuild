'use strict';

// #region Imports
var misc = require('./misc.js');
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
    '    staticdev [options | path]',
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
    'staticdev: ' + pkg.description + ' (v' + pkg.version + ')',
    ''
  ]);
}
exports.printPackageHeader = printPackageHeader;

function printStatusListening(config, port) {
  var msg = 'staticdev server listening on port ' + port + '.';
  if (config.restart)
    msg += ' To restart, enter command: rs';
  console.log(msg);
}
exports.printStatusListening = printStatusListening;

function printVersion() {
  console.log('staticdev v' + pkg.version);
}
exports.printVersion = printVersion;