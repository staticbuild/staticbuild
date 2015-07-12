'use strict';

// This is an alternate entry, executed by nodemon.
// The main entry is in bin/staticbuild.

var bincmd = require('../bincmd/index.js');
bincmd({ nodemonEntry: true });
