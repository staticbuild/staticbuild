'use strict';

// # Alternate entry-script executed by nodemon.
// See ./bin/staticbuild

process.title = 'staticbuild';

var staticbuild = require('./lib/staticbuild.js');

staticbuild.run();
