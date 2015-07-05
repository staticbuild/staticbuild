'use strict';

// # Alternate entry-script executed by nodemon.
// See ./bin/staticdev

process.title = 'staticdev';

var staticdev = require('./lib/staticdev.js');

staticdev.run();
