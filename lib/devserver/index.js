'use strict';

var staticbuild = require('../../index.js');
var os = require('os');
var path = require('path');

var app;
var config = staticbuild.config;
var server;

function app_listening() {
  var port = server.address().port;
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

function run(opts) {
  if (!config.restart || opts.nodemonEntry) {
    app = require('./app.js');
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
    script: path.resolve(__dirname, './nodemon.js'),
    args: args,
    watch: staticbuild.getWatchPaths(),
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
