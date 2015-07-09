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
