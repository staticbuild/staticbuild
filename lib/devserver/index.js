'use strict';

var cli = require('../bincmd/cli.js');
var os = require('os');
var path = require('path');

var app;
var build;
var server;

function app_listening() {
  var port = server.address().port;
  var host = build.devServer.host || 'localhost';
  var msg = 'staticbuild dev server listening @ ' + 
    host + ':' + 
    port + '.';
  console.log(msg);
  console.log(os.EOL + 'Commands');
  if (build.devServer.restart)
    console.log(' rs:  Restart.');
  console.log(  '  q:  Quit.');
  //console.log('   q:  Quit. (or Ctrl + C)');
}

function run(targetBuild, opts) {
  build = targetBuild;
  if (process.env.npm_config_global === true) {
    cli.printErrorAndExit('Please install staticbuild locally ' +
      'or run `staticbuild setup` to create a new project.', 1007);
    return;
  }
  if (!build.devServer.restart || opts.nodemonEntry) {
    app = require('./app.js');
    app.init(build);
    server = app.listen(
      build.devServer.port, 
      build.devServer.host, 
      app_listening);
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
  if (build.devServer.restart)
    opts.delay = build.devServer.restartDelay;
  
  function afterNodemonExit() {
    process.exit();
  }

  function quitOnQ(data) {
    // See https://github.com/remy/nodemon/issues/631
    data = data.toString().trim();
    if (data.length === 1 && data.charCodeAt(0) === 113) { // 113 = 'q'
      nodemon
        .once('exit', afterNodemonExit)
        .emit('quit');
    }
  }
  process.stdin.on('data', quitOnQ);

  if (build.verbose) {
    console.log('Running nodemon with options:');
    console.dir(opts);
  }
  nodemon(opts);
}
