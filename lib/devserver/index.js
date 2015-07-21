'use strict';

var cli = require('../bincmd/cli.js');
var os = require('os');
var path = require('path');

var app;
var build;
var server;

function app_listening() {
  var port = server.address().port;
  var host = build.devhost || 'localhost';
  var msg = 'staticbuild dev server listening @ ' + 
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

function run(targetBuild, opts) {
  build = targetBuild;
  if (process.env.npm_config_global === true) {
    cli.printErrorAndExit('Please install staticbuild locally ' +
      'or run `staticbuild setup` to create a new project.', 1007);
    return;
  }
  if (!build.restart || opts.nodemonEntry) {
    app = require('./app.js');
    app.init(build);
    server = app.listen(build.devport, build.devhost, app_listening);
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
    watch: build.getWatchPaths(),
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
