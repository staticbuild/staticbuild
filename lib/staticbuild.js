'use strict';

// #region Imports
var cli = require('./cli.js');
var config = require('./config.js');
var info = require('./info.js');
// #endregion

var app;

function app_listening() {
  info.printStatusListening(server.address().port);
}

function run() {
  if (runInfo())
    return;
  if (!config.load())
    return;
  if (runTask())
    return;
  runApp();
}
exports.run = run;

function runApp() {
  app = require('./app.js');
  app.run();
}

function runInfo() {
  var args = cli.args;
  if (args.version) {
    info.printVersion();
    return true;
  }
  if (args.help) {
    info.printHelp();
    return true;
  }
  return false;
}

function runTask() {
  if (!cli.args.initDefault)
    return false;
  config.writeDefaultConfigFile();
  return true;
}
