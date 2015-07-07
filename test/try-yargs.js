'use strict';

// #region Imports
var Yargs = require('yargs');
// #endregion

var pkg = require('../package.json');
var argv;

function run() {
  argv = configureYargs()
  .usage(mainUsage())
  .version(titleVersion(), 'v', 'Show version number.')
  .alias('v', 'version')

  .command('dev', 'Run the development web server.', runDevServer)

  .command('setup', 'Setup a new project.', runSetup)

  .option('V', {
      alias: 'verbose',
      description: 'Enables verbose output.'
    })

  .help('h', 'Show help.').alias('h', 'help')
  .argv;

  console.dir(argv);
}

function runDevServer(yargs) {
  argv = configureYargs(yargs)
  .usage(commandUsage('dev', '[options] <path>', 'Development server.'))
  .option('n', {
    alias: 'norestart',
    description: 'Disables the built-in nodemon server restart.',
    type: 'boolean'
  })
  .option('r', {
    alias: 'restart-delay',
    description: 'Number of seconds to delay nodemon restarts.',
    type: 'number'
  })
  .help('h', 'Show help.').alias('h', 'help')
  .epilogue('  path           Path to a staticbuild.json file or directory to find one.\n' +
'                 If no path is supplied, the current directory is used.')
  .argv;
  
  console.log('running dev server...');

}

function runSetup(yargs) {
  argv = configureYargs(yargs)
  .usage(commandUsage('setup', '[options] <path>', 'Setup.'))
  .help('h', 'Show help.').alias('h', 'help')
  .epilogue('  path           Path for a new staticbuild.json file or project directory.')
  .argv;
  
  console.log('running setup...');
}

// #region Helpers

function commandUsage(command, options, description) {
  return pkg.name + ' v' + pkg.version + ' - ' + description + 
  '\n\nUsage:\n  ' + pkg.name + ' ' + command + ' ' + options;
}

function configureYargs(yargs) {
  yargs = yargs || Yargs;
  return yargs.wrap(null);
}

function mainUsage() {
  return commandUsage('<command>', '[options]', pkg.description);
}

function titleVersion() {
  return pkg.name + ' v' + pkg.version;
}

// #endregion

run();
