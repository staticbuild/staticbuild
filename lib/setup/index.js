'use strict';

// #region Imports
var StaticBuild = require('../../index.js');
// #endregion

function run(targetBuild) {
  // I'd like intellisense for `build` in the rest of this file, so I added 
  // `|| StaticBuild.current` to the next line so I could get it, since VS is 
  // not taking the hint from the jsdoc @param type. So, sue me :) targetBuild
  // is always passed, so it never really gets executed. - waynebloss
  // TODO: Remove the `|| StaticBuild.current` when possible.
  var build = targetBuild || StaticBuild.current;
  
  build.writeFileSync();

}
exports.run = run;
