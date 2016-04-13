'use strict';

// #region Imports
var ncp = require('ncp').ncp;
var path = require('path');
// #endregion

ncp.limit = 2;

function run(targetBuild, args) {
  var from = path.join(__dirname, '../../content/setup/basic');
  from = path.normalize(from);
  
  var to = args && args._ && args._[1] ? args._[1] : process.cwd();
  to = path.normalize(to);

  console.log('Setting up basic site template....');

  ncp(from, to, function(err) {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }
    console.log('Done.')
    console.log('When ready, please run: npm install && bower install');
    console.log('To view the site during development: npm run dev');
    console.log('To generate the site for production: gulp');
  });
}
exports.run = run;
