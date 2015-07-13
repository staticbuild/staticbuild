'use strict';

var StaticBuild = require('../../index.js');
var os = require('os');
var path = require('path');

var app;
var server;

function app_listening() {
  var build = StaticBuild.current;
  var port = server.address().port;
  var host = build.host || 'localhost';
  var msg = 'staticbuild development server listening @ ' + 
    host + ':' + 
    port + '.';
  console.log(msg);
  if (build.restart)
    console.log('To restart, enter command: rs');
  if (os.platform() === 'darwin')
    console.log('Press Cmd + C to exit.');
  else
    console.log('Press Ctrl + C to exit.');
}

function run(build, opts) {
  if (!build.restart || opts.nodemonEntry) {
    app = require('./app.js');
    app.init(build);
    server = app.listen(build.port, build.host, app_listening);
  } else
    runWithNodemon(build);
}
exports.run = run;

function runWithNodemon(build) {
  var nodemon = require('nodemon');
  
  var args = Array.prototype.slice.call(process.argv, 2);
  
  var opts = {
    script: path.resolve(__dirname, './nodemon.js'),
    args: args,
    watch: StaticBuild.getWatchPaths(),
    ext: 'coffee,jade,js,json,litcoffee'
  };
  if (build.restart)
    opts.delay = build.restartDelay;
  if (build.verbose) {
    console.log('Running nodemon with options:');
    console.dir(opts);
  }
  nodemon(opts);
}
