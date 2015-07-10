'use strict';

var app = require('./app.js');
var cli = require('../cli.js');
var config = require('../config.js');

var server;

function app_listening() {
  cli.printStatusListening(config, server.address().port);
}

function run(opts) {
  if (!config.restart || opts.nodemonEntry) {
    app.init();
    server = app.listen(config.port, config.host, app_listening);
  } else
    runWithNodemon();
}
exports.run = run;

function runWithNodemon() {
  var nodemon = require('nodemon');
  
  var args = Array.prototype.slice.call(process.argv, 2);
  
  var opts = {
    script: path.resolve(__dirname, './devserver/nodemon.js'),
    args: args,
    watch: config.getWatchPaths(),
    ext: 'coffee,jade,js,json,litcoffee'
  };
  if (config.restart)
    opts.delay = config.restartDelay;
  if (config.verbose) {
    console.log('Running nodemon with options:');
    console.dir(opts);
  }
  nodemon(opts);
}
