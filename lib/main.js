'use strict';

// #region Imports
var cli = require('./cli.js');
var config = require('./config.js');
var info = require('./info.js');
var misc = require('./misc.js');
// #endregion

var app;
var server;

function app_listening() {
  info.printStatusListening(config, server.address().port);
}

function run() {
  if (!config.load())
    return;
  if (!misc.chdir(config.basedir, true))
    return;
  if (cli.args.setup)
    runSetup();
  else if (cli.args.dev)
    runDevserver();
}
exports.run = run;

function runDevserver() {
  app = require('./devserver/index.js');
  app.init();
  server = app.listen(config.port, config.host, app_listening);
}

function runSetup() {
  config.writeDefaultConfigFile();
}
