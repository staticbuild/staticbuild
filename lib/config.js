'use strict';

var config = {
  
  // #region Core
  
  // TODO: Change the default of sourcedir to a magic string which causes config 
  // to search for "src" or "source". Alternatively, accept directory paths like
  // "src|source", split on the pipe and use the first existing entry.
  
  basedir: process.cwd(),
  data: {},
  datafile: '',
  destdir: 'dest',
  devmode: false,
  filename: 'staticbuild.json',
  filepath: '',
  path: process.cwd(),
  sourcedir: 'src',
  verbose: false,
  version: '0.0.0',
  // #endregion
  
  // #region Hashids
  hashids: {
    alphabet: '0123456789abcdefghijklmnopqrstuvwxyz',
    minLength: 4,
    salt: 'BpoIsQlrssEz56uUbfgLu5KNBkoCJiyY'
  },
  // #endregion
  
  // #region Locales
  defaultLocale: 'en',
  locale: 'en',
  locales: ['en'],
  localesdir: 'locales',
  // #endregion
  
  // #region Web Host
  favicon: 'favicon.ico',
  host: process.env.HOST || undefined,
  port: process.env.PORT || 8080,
  restart: false,
  restartDelay: 0,
  // #endregion
  
  // #region Template
  template: {
    engine: 'nunjucks',
    extension: 'htm',
    extensionsfile: '',
    filtersfile: '',
    functionsfile: '',
    globals: {},
    globalsfile: '',
    indexfile: 'index',
    localsfile: '',
    options: {
      autoescape: true
    }
  },
  // #endregion
  
  // #region CSS
  css: {
    map: {
      enabled: true,
      inline: false
    },
    preprocessor: 'less'
  },
  // #endregion

  ignore: [
    '.gitignore',
    '*.layout.htm',
    '*.part.htm',
    '*.map'
  ],
  info: [],
  warnings: []
};
module.exports = config;
