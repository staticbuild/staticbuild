'use strict';

// #region Imports
var StaticBuild = require('../../index.js');
// #endregion

function run(targetBuild) {
  var build = targetBuild || StaticBuild.current;
  
  console.log('This command not yet implemented.');
}
exports.run = run;
