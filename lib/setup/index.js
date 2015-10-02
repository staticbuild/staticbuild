'use strict';

// #region Imports
var StaticBuild = require('../../index.js');
// #endregion

function run(targetBuild) {
  // CONSIDER: The `|| StaticBuild.current` isn't really necessary.
  var build = targetBuild || StaticBuild.current;
  
  build.writeFileSync();

}
exports.run = run;
