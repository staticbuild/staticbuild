'use strict';

var pkg = require('../package.json');

var argv = require('yargs')
.wrap(null)

.usage(
  pkg.name + ' v' + pkg.version + ' - ' + pkg.description + 
  '\nUsage:\n  ' + pkg.name + ' <command> [options] [path]'
)

.version(
  pkg.name + ' v' + pkg.version, 'v', 
  'Show version number.')
.alias('v', 'version')

.command('dev', 'Run the development web server.', 
function (yargs) {
  
  argv = yargs
  .wrap(null)
  .usage(
    pkg.name + ' v' + pkg.version + ' - Development server.\n' + 
  '\nUsage:\n  ' + pkg.name + ' dev [options] [path]'
  )
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

})

.command('setup', 'Setup a new project.')

.option('V', {
  alias: 'verbose',
  description: 'Enables verbose output.'
})

.help('h', 'Show help.').alias('h', 'help')
.epilogue('  path           Path to a staticbuild.json file or directory to find one.\n' +
'                 If no path is supplied, the current directory is used.')
.argv;

console.dir(argv);
