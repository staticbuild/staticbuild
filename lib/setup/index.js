'use strict';

// #region Imports
var StaticBuild = require('../../index.js');
// #endregion

function run(targetBuild) {
  var build = targetBuild || StaticBuild.current;
  
  build.writeFileSync();

}
exports.run = run;
