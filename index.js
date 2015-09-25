'use strict';

// #region Imports
var fs = require('fs');
var Hashids = require('hashids');
var i18n = require('i18n');
var istype = require('type-check').typeCheck;
var lodash = require('lodash');
var path = require('path');
var requireNew = require('require-new');
// #endregion

function StaticBuild(pathOrOpt, opt) {
  // #region Non-Constructor Call Handling
  if (!(this instanceof StaticBuild))
    return new StaticBuild(pathOrOpt, opt);
  // #endregion
  
  // #region Constructor Options
  // - All options are assigned to the StaticBuild instance in `configure`.
  // - Some options are pre-assigned right in the constructor.
  opt = lodash.assign({
    // Required
    path: (istype('String', pathOrOpt) ? 
      String.prototype.trim.call(pathOrOpt) : ''),
    // Optional
    useBundlePath: false,
    devmode: false,
    verbose: 0,
    restart: false,
    restartDelay: 0
  }, opt);
  // #endregion
  
  // #region Base
  this.devmode = opt.devmode;
  this.verbose = false;
  // #endregion

  // #region Paths
  this.basedir = process.cwd();
  this.destdir = 'dist';
  this.filename = 'staticbuild.json';
  this.filepath = '';
  this.ignore = [
    '.gitignore',
    '*.layout.htm',
    '*.part.htm',
    '*.map'
  ];
  this.path = process.cwd();
  this.pathMap = {
    bower: { fs: 'bower_components' }
  };
  this.pathTokens = {
    bundleName: [
      /\$\(bundle\)/g
    ],
    bundleNameWithRev: [
      /\$\(bundleRev\)/g
    ],
    packageVersionDefault: [
      // ~pkgVer (except ~pkgVerH or ~pkgVerN)
      /~pkgVer(?![H,N])/g,
      // ~pv (except ~pvh or ~pvn)
      /~pv(?![h,n])/g,
      // $(pkgVer)
      /\$\(pkgVer\)/g
    ],
    packageVersionHashid: [
      /~pkgVerHash/g,
      /~pvh/g,
      /\$\(pkgVerHash\)/g
    ],
    packageVersionNumber: [
      /~pkgVerNum/g,
      /~pvn/g,
      /\$\(pkgVerNum\)/g
    ]
  };
  this.sourcedir = 'src';
  // #endregion
  
  // #region Package
  this.packagefile = 'package.json';
  /** Data from package.json */
  this.pkg = {};
  /** Package Version */
  this.pkgVer = '';
  /** Package Version Hashid */
  this.pkgVerHash = '';
  /** True if pkgVerHash should be used when replacing 
   * pathTokens.packageVersionDefault. */
  this.usePkgVerHashDefault = true;
  // #endregion

  // #region Dev Server
  this.devhost = undefined;
  this.devport = 8080;
  this.restart = false;
  this.restartDelay = 0;
  // #endregion
  
  // #region Hashids
  this.hashids = {
    alphabet: '0123456789abcdefghijklmnopqrstuvwxyz',
    minLength: 4,
    salt: 'BpoIsQlrssEz56uUbfgLu5KNBkoCJiyY'
  };
  this.versionHashIds = {};
  // #endregion
  
  // #region Locales
  this.defaultLocale = 'en';
  this.locale = 'en';
  this.locales = ['en'];
  this.localesdir = 'locales';
  // #endregion
  
  // #region Engine
  this.defaultEngineName = 'jade';
  this.engine = {
    jade: {
      extension: 'jade',
      options: { pretty: true, cache: false }
    },
    less: {
      extension: 'less',
      map: { enabled: true, inline: false }
    },
    nunjucks: {
      extension: 'htm',
      extensions: undefined,
      extensionsfile: '',
      filters: undefined,
      filtersfile: '',
      functions: undefined,
      options: { autoescape: true }
    }
  };
  // #endregion
  
  // #region Views
  this.autocontext = true;
  this.buildvar = 'build';
  this.context = {};
  this.contextfile = '';
  this.defaultView = 'index';
  this.favicon = 'favicon.ico';
  // #endregion
  
  // #region Status
  this.errors = [];
  this.info = [];
  this.warnings = [];
  // #endregion
  
  // #region Bundling
  this.bundle = {};
  this.bundlefile = '';
  this.bundlefilepath = '';
  // TODO: Change the useBundlePath default to `!opt.devmode` when bundling works.
  this.useBundlePath = false; //!opt.devmode;
  // #endregion

  /** @namespace Gulp related functions. */
  this.gulp = {
    renameFile: gulpRenameFile.bind(this)
  };

  configure(this, opt);
  StaticBuild.current = this;
  load(this);
}
module.exports = StaticBuild;

// #region Cache Busting

StaticBuild.prototype.versionToHashId = 
function (version) {
  var vh = this.versionHashIds[version];
  if (vh)
    return vh;
  var vi = StaticBuild.versionToInt(version);
  vh = this.hashids.current.encode(vi);
  this.versionHashIds[version] = vh;
  return vh;
};

function versionToInt(version) {
  version = String.prototype.trim.call(version);
  var parts = String.prototype.split.call(version, '.');
  var i, len = parts.length;
  for (i = 0; i < len; i++)
    parts[i] = lodash.padLeft(parts[i], 3, '0');
  version = parts.join('');
  return parseInt(version, 10);
}
StaticBuild.versionToInt = versionToInt;
StaticBuild.prototype.versionToInt = versionToInt;

// #endregion

// #region Configuration

function configure(build, opt) {
  // Normalize and apply options directly to the build instance.
  normalizePathOptions(opt);
  lodash.assign(build, opt);
  // Configure from file.
  var data = build.tryRequireNew(build.filepath);
  if (!data)
    return;
  configureBase(build, data);
  configurePackage(build, data);
  configureDevServer(build, data);
  configureEngine(build, data);
  configureHashids(build, data);
  configureLocales(build, data);
  configureBundles(build, data);
  configureViews(build, data);
}

function configureBase(build, data) {
  // devmode
  // - Not configurable via file data. See StaticBuild constructor argument
  // `opt.devmode`, which is applied to the StaticBuild in `configure`.
  //
  // verbose
  // - Can only be turned ON from build, not off.
  if (data.verbose === true || data.verbose > 0)
    build.verbose = data.verbose;
}

function configureBundles(build, data) {
  var bundleData;
  // useBundlePath is already set from the bincmd cli args for devmode.
  if (!build.devmode && istype('Boolean', data.useBundlePath))
    build.useBundlePath = data.useBundlePath;
  if (istype('Object', data.bundle))
    lodash.merge(build.bundle, data.bundle);
  else if (istype('String', data.bundlefile)) {
    build.bundlefile = data.bundlefile.trim();
    if (build.bundlefile.length > 0) {
      build.bundlefilepath = path.resolve(build.basedir, build.bundlefile);
      bundleData = build.tryRequireNew(build.bundlefilepath);
      lodash.merge(build.bundle, bundleData);
    }
  }
}

function configureDevServer(build, data) {
  // devhost
  if (istype('String', data.devhost))
    build.devhost = data.devhost;
  // devport
  if (istype('Number', data.devport))
    build.devport = data.devport;
}

function configureEngine(build, data) {
  if (istype('Object', data.engine)) {
    configureJade(build, data.engine);
    configureLESS(build, data.engine);
    configureNunjucks(build, data.engine);
  }
  if (
    istype('String', data.defaultEngine) && 
    data.defaultEngine in build.engine && 
    data.defaultEngine !== build.defaultEngineName 
  )
    build.defaultEngineName = data.defaultEngine;
}

function configureHashids(build, data) {
  var ch = build.hashids;
  var hi = data.hashids;
  if (istype('Object', hi)) {
    // alphabet
    if (istype('String', hi.alphabet))
      ch.alphabet = hi.alphabet;
    // minLength
    if (istype('Number', hi.minLength))
      ch.minLength = hi.minLength;
    // salt
    if (istype('String', hi.salt))
      ch.salt = hi.salt;
  }
  build.hashids.current = new Hashids(
    ch.salt,
    ch.minLength,
    ch.alphabet
  );
}

function configureJade(build, data) {
  var jade = data.jade;
  if (!istype('Object', jade))
    return;
  // extension
  if (istype('String', jade.extension))
    build.engine.jade.extension = jade.extension;
  // options
  if (istype('Object', data.options))
    lodash.merge(build.engine.jade.options, data.options);
}

function configureLESS(build, data) {
  var less = data.less;
  if (!istype('Object', less))
    return;
  // extension
  if (istype('String', less.extension))
    build.engine.less.extension = less.extension;
  if (istype('Object', less.map)) {
    // enabled
    if (istype('Boolean', less.map.enabled))
      build.engine.less.map.enabled = less.map.enabled === true;
    // inline
    if (istype('Boolean', less.map.inline))
      build.engine.less.map.inline = less.map.inline === true;
  }
}

function configureLocales(build, data) {
  // defaultLocale
  if (istype('String', data.defaultLocale)) {
    build.defaultLocale = data.defaultLocale;
    build.locale = build.defaultLocale;
  }
  // localesdir
  if (istype('String', data.localesdir))
    build.localesdir = data.localesdir;
  
  // locales
  if (istype('Array', data.locales))
    build.locales = Array.prototype.slice.call(data.locales);
}

function configureNunjucks(build, data) {
  var nunjucks = data.nunjucks;
  if (!istype('Object', nunjucks))
    return;
  // extension
  if (istype('String', nunjucks.extension))
    build.engine.nunjucks.extension = nunjucks.extension;
  // extensions | extensionsfile
  if (istype('String', nunjucks.extensions))
    build.engine.nunjucks.extensionsfile = nunjucks.extensions;
  else if (istype('String', nunjucks.extensionsfile))
    build.engine.nunjucks.extensionsfile = nunjucks.extensionsfile;
  // filters | filtersfile
  if (istype('String', nunjucks.filters))
    build.engine.nunjucks.filtersfile = nunjucks.filters;
  else if (istype('String', nunjucks.filtersfile))
    build.engine.nunjucks.filtersfile = nunjucks.filtersfile;
  // options
  if (istype('Object', nunjucks.options))
    lodash.merge(build.engine.nunjucks.options, nunjucks.options);
}

function configurePackage(build, data) {
  // package | packagefile
  if (istype('String', data["package"]))
    build.packagefile = data["package"];
  else if (istype('String', data.packagefile))
    build.packagefile = data.packagefile;
}

function configurePaths(build, data) {
  // source | sourcedir
  if (istype('String', data.sourcedir))
    build.sourcedir = data.sourcedir;
  else if (istype('String', data.source))
    build.sourcedir = data.source;
  // dest | destdir
  if (istype('String', data.destdir))
    build.destdir = data.destdir;
  else if (istype('String', data.dest))
    build.destdir = data.dest;
  // pathMap
  if (istype('Object', data.pathMap)) {
    build.pathMap = data.pathMap;
  }
  lodash.forEach(build.pathMap, function (mapping, name, pathMap) {
    if (istype('String', mapping.fs) && mapping.url === undefined)
      mapping.url = '/' + path.basename(mapping.fs);
  });
  // pathTokens
  if (istype('Object', data.pathTokens))
    lodash.merge(build.pathTokens, data.pathTokens);
  if (istype('Boolean', data.usePkgVerHashDefault))
    build.usePkgVerHashDefault = data.usePkgVerHashDefault;
}

function configureViews(build, data) {
  // autocontext
  if (istype('Boolean', data.autocontext))
    build.autocontext = data.autocontext;
  // buildvar
  if (istype('String', data.buildvar))
    build.buildvar = data.buildvar;
  // context | contextfile
  if (istype('String', data.context))
    build.contextfile = data.context;
  else if (istype('String', data.contextfile))
    build.contextfile = data.contextfile;
  else if (istype('Object', data.context)) {
    build.contextfile = null;
    build.context = data.context;
  }
  // defaultview | defaultView
  if (istype('String', data.defaultview))
    build.defaultView = data.defaultview;
  else if (istype('String', data.defaultView))
    build.defaultView = data.defaultView;
  // favicon
  if (istype('String', data.favicon))
    build.favicon = data.favicon;
}

// #endregion

// #region Load

function load(build) {
  // Resolve all paths.
  if (build.packagefile)
    build.packagefile = build.resolvePath(build.packagefile);
  if (build.sourcedir)
    build.sourcedir = build.resolvePath(build.sourcedir);
  if (build.destdir)
    build.destdir = build.resolvePath(build.destdir);
  if (build.localesdir)
    build.localesdir = build.resolvePath(build.localesdir);
  if (build.engine.nunjucks.extensionsfile)
    build.engine.nunjucks.extensionsfile = build.resolvePath(build.engine.nunjucks.extensionsfile);
  if (build.engine.nunjucks.filtersfile)
    build.engine.nunjucks.filtersfile = build.resolvePath(build.engine.nunjucks.filtersfile);
  if (build.contextfile)
    build.globalsfile = build.resolvePath(build.contextfile);
  // Load stuff.
  loadPackage(build);
  loadLocales(build);
  loadViewContext(build);
  loadNunjucksFiles(build);
}

function loadLocales(build) {
  // TODO: Load locale names from localesdir if it exists.
  i18n.configure({
    extension: '.json',
    indent: '  ',
    locales: build.locales,
    defaultLocale: build.defaultLocale,
    directory: build.localesdir,
    objectNotation: true,
    prefix: '',
    updateFiles: true
  });
  i18n.setLocale(build.locale);
  currentLocale = build.locale;
}

function loadPackage(build) {
  if (!build.packagefile)
    return;
  var data = build.tryRequireNew(build.packagefile);
  if (!data)
    return;
  build.pkg = data;
  var version = data.version;
  build.pkgVer = version;
  build.pkgVerHash = build.versionToHashId(version);
}

function loadNunjucksFiles(build) {
  var nunjucks = build.engine.nunjucks;
  var loaded = {};
  // Read extensions and filters.
  if (nunjucks.extensionsfile)
    loaded.extensions = build.tryRequireNew(nunjucks.extensionsfile);
  if (nunjucks.filtersfile)
    loaded.filters = build.tryRequireNew(nunjucks.filtersfile);
  
  if (loaded.extensions)
    nunjucks.extensions = lodash.merge(nunjucks.extensions, loaded.extensions);
  
  nunjucks.filters = require('./lib/nunjucks/filters.js').createForBuild(build);
  if (loaded.filters)
    nunjucks.filters = lodash.merge(nunjucks.filters, loaded.filters);

  // Some core functions specialized for nunjucks.
  nunjucks.functions = require('./lib/nunjucks/functions.js').createForBuild(build);
}

function loadViewContext(build) {
  var context = build.context;
  if (build.contextfile)
    context = build.context = 
      build.tryRequireNew(build.contextfile) || context;
  if (build.autocontext) {
    // Add some stuff to the global context.
    if (build.buildvar)
      context[build.buildvar] = build;
    context.t = build.translate.bind(build);
    context.tn = build.translateNumeric.bind(build);
  }
}

// #endregion

// #region Locales

var currentLocale;

StaticBuild.prototype.translate = 
function (str, etc) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged(this);
  return i18n.__.apply(i18n, args);
};

StaticBuild.prototype.translateNumeric = 
function (singular, plural, value) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged(this);
  return i18n.__n.apply(i18n, args);
};

function updateLocaleIfChanged(build) {
  if (build.locale === currentLocale)
    return;
  i18n.setLocale(build.locale);
  currentLocale = build.locale;
}

StaticBuild.prototype.trySetLocale = 
function (locale, errback) {
  if (!locale)
    return false;
  locale = String.prototype.trim.call(locale);
  if (Array.prototype.indexOf.call(this.locales, locale) < 0) {
    if (errback)
      errback(new Error('Invalid locale.'), null);
    return false;
  }
  this.locale = locale;
  if (errback)
    errback(null, locale);
  return true;
};

// #endregion

// #region Options

function fileFromPathOption(opt) {
  if (opt.filepath !== undefined)
    return true;
  if (opt.path === undefined)
    return false;
  try {
    var stat = fs.statSync(opt.path);
    if (stat.isFile()) {
      opt.filepath = path.resolve(opt.path);
      return true;
    }
  } catch (err) {
  }
  return false;
}

function normalizePathOptions(opt) {
  if (fileFromPathOption(opt)) {
    opt.basedir = path.resolve(path.dirname(opt.filepath));
    opt.filename = path.basename(opt.filepath);
  }
  else if (opt.path !== undefined) {
    opt.filename = opt.filename || 'staticbuild.json';
    opt.basedir = path.resolve(opt.basedir || process.cwd(), opt.path);
    opt.filepath = path.join(opt.basedir, opt.filename);
  }
}

// #endregion

// #region Paths

/** Returns the filepath with the given value appended to the filename, before 
 * the extension. */
function appendFilename(filepath, valueToAppend) {
  var pfile = path.parse(filepath);
  var result = Array.prototype.join.call([
    pfile.dir,
    '/',
    pfile.name,
    valueToAppend,
    pfile.ext
  ], '');
  return result;
}
StaticBuild.appendFilename = appendFilename;
StaticBuild.prototype.appendFilename = appendFilename;

/** Returns the filepath with the given part appended to the filename, before 
 * the extension, using a standard dash as a delimiter. */
function appendFilenamePart(filepath, part) {
  return StaticBuild.appendFilename(filepath, '-' + part);
}
StaticBuild.appendFilenamePart = appendFilenamePart;
StaticBuild.prototype.appendFilenamePart = appendFilenamePart;

/** Returns a relative path derived from the build's destdir. */
StaticBuild.prototype.dest =
function (pattern) {
  return this.relativePattern(this.destdir, pattern);
};

/** Returns a relative path derived from the build's locale directory.*/
StaticBuild.prototype.destLocale =
function (pattern) {
  return this.relativePattern(path.join(this.destdir, this.locale), pattern);
};

/** Returns an array of paths outside of src that are watched in dev mode. */
StaticBuild.prototype.getWatchPaths = 
function () {
  var paths = [];
  if (this.contextfile)
    paths.push(this.contextfile);
  if (this.engine.nunjucks.extensionsfile)
    paths.push(this.engine.nunjucks.extensionsfile);
  if (this.engine.nunjucks.filtersfile)
    paths.push(this.engine.nunjucks.filtersfile);
  if (this.packagefile)
    paths.push(this.packagefile);
  return paths;
};

/** Returns true if the given path resides within the build's vendorUrlPath. */
StaticBuild.prototype.inVendorUrlPath = 
function (pathStr) {
  var bp = this.vendorUrlPath;
  if (!bp || !pathStr)
    return false;
  return (pathStr.substr(0, bp.length) === bp);
};

/** Possibly renames the given file using StaticBuild rules. */
function gulpRenameFile(file) {
  /*jshint validthis: true */
  // This method is bound to the instance in StaticBuild constructor.
  file.dirname = this.runtimePath(file.dirname);
  file.basename = this.runtimePath(file.basename);
}

/** Returns a relative path derived from the build's basedir. */
StaticBuild.prototype.relativePath =
function (basePath) {
  return path.relative(this.basedir, basePath).replace('\\', '/');
};

/** Returns a relative path pattern derived from the build's basedir.
 * (e.g. '../path/to/##/#.js' but with asterisks instead of hashes) */
StaticBuild.prototype.relativePattern =
function (basePath, pattern) {
  if (pattern === undefined || pattern === null || !pattern.length)
    return this.relativePath(basePath);
  var prefix = pattern.charAt(0);
  if (prefix === '!')
    return prefix + this.relativePath(basePath) + pattern.substr(1);
  else
    return this.relativePath(basePath) + pattern;
};

function replaceAll(str, replacements, value) {
  var i, len = replacements.length;
  for (i = 0; i < len; i++)
    str = str.replace(replacements[i], value);
  return str;
}

/** Returns the given pathStr with pathTokens replaced for use at runtime. */
StaticBuild.prototype.runtimePath = 
function (pathStr, opt) {
  var defaultPkgVer;
  opt = lodash.assign({
    production: false
  }, opt);
  if (!this.devmode || opt.production) {
    // Package Versions
    defaultPkgVer = (this.usePkgVerHashDefault ? this.pkgVerHash : this.pkgVer);
    pathStr = replaceAll(pathStr, this.pathTokens.packageVersionDefault, defaultPkgVer);
    pathStr = replaceAll(pathStr, this.pathTokens.packageVersionHashid, this.pkgVerHash);
    pathStr = replaceAll(pathStr, this.pathTokens.packageVersionNumber, this.pkgVer);
    // Bundles
    if (opt.bundle)
      pathStr = replaceAll(pathStr, this.pathTokens.bundleName, opt.bundle);
    if (opt.bundleRev)
      pathStr = replaceAll(pathStr, this.pathTokens.bundleNameWithRev, opt.bundleRev);
  }
  return pathStr;
};

/** Returns an absolute file-system path resolved from the build's basedir. */
StaticBuild.prototype.resolvePath = 
function (basePath) {
  return path.resolve(this.basedir, basePath);
};

/** Returns an absolute file-system path resolved from the build's sourcedir. */
StaticBuild.prototype.resolveSrcPath = 
function (srcPath) {
  return path.resolve(this.sourcedir, srcPath);
};

/** Returns a relative path derived from the build's sourcedir. */
StaticBuild.prototype.src =
function (pattern) {
  return this.relativePattern(this.sourcedir, pattern);
};

/** Attempts to require an uncached instance of the given filepath's module 
 * using require-new. */
function tryRequireNew(filepath) {
  var build, errMsg;
  if (filepath === undefined || filepath === null)
    return;
  try {
    return requireNew(filepath);
  } catch (err) {
    errMsg = err.code === 'MODULE_NOT_FOUND' ? 
        'File not found: ' + filepath :
        'Error loading file ' + filepath + ' - ' + err.toString();
    build = this instanceof StaticBuild ? this : StaticBuild.current;
    if (build)
      build.warnings.push(errMsg);
    else
      console.error(errMsg);
  }
}
StaticBuild.tryRequireNew = tryRequireNew;
StaticBuild.prototype.tryRequireNew = tryRequireNew;

// #endregion

// #region Write
// TODO: Finish Write functionality for use with interactive setup command.

StaticBuild.prototype.writeFileSync = 
function (tofile) {
  var INDENT = 2;
  
  tofile = tofile || 'staticbuild.json';
  
  var config = lodash.cloneDeep(this);
  
  //
  if (config.datafile)
    config.data = config.datafile;
  else
    config.data = "";
  
  // Make absolute paths relative.
  config.dest = path.relative(config.basedir, config.destdir);
  config.localesdir = path.relative(config.basedir, config.localesdir);
  config.source = path.relative(config.basedir, config.sourcedir);
  
  // Delete object data.
  delete config.basedir;
  delete config.destdir;
  delete config.devmode;
  delete config.filepath;
  delete config.filename;
  delete config.pkg;
  delete config.packagefile;
  delete config.path;
  delete config.sourcedir;
  delete config.verbose;
  
  delete config.hashids.current;
  delete config.datafile;
  delete config.locale;
  
  delete config.restart;
  delete config.restartDelay;
  
  delete config.errors;
  delete config.info;
  delete config.warnings;
  
  var jsonStr = JSON.stringify(config, null, INDENT);
  
  fs.writeFileSync(tofile, jsonStr);
};

// #endregion

// #region HTML

StaticBuild.prototype.link =
function (srcPath) {
  srcPath = this.runtimePath(srcPath);
  var ml = '\n    ' +
    '<link rel="stylesheet" type="text/css" href="' + 
    srcPath + 
    '"/>';
  return ml;
};

StaticBuild.prototype.script =
function (srcPath) {
  srcPath = this.runtimePath(srcPath);
  var ml = '\n    ' + 
    '<script type="text/javascript" src="' + 
    srcPath + 
    '"></script>';
  return ml;
};

// #endregion

// #region Bundling

StaticBuild.prototype.addBundleCss =
function (name, pathStr) {
  var data = this.bundle[name];
  data.styles = data.styles.concat(pathStr);
};

StaticBuild.prototype.addBundleJs =
function (name, pathStr) {
  var data = this.bundle[name];
  data.scripts = data.scripts.concat(pathStr);
};

/** Returns the html for the given bundles. */
StaticBuild.prototype.bundles = 
function (nameOrNames, sourceType) {
  if (!nameOrNames)
    throw new Error('Argument missing: nameOrNames');
  var ml = '';
  var names = [].concat(nameOrNames);
  var self = this;
  
  if (sourceType === undefined || sourceType === 'css') {
    // Output css for all bundles
    names.forEach(function (name) {
      var data = self.bundle[name];
      if (!data) {
        console.error('CSS bundle not found: ' + name);
        return;
      }
      if (self.useBundlePath)
        ml += self.link(data.path.css);
      else
        data.styles.forEach(function (source) { ml += self.link(source); });
    });
  }
  if (sourceType === undefined || sourceType === 'js') {
    // Output js for all bundles
    names.forEach(function (name) {
      var data = self.bundle[name];
      if (!data) {
        console.error('JavaScript bundle not found: ' + name);
        return;
      }
      if (self.useBundlePath)
        ml += self.script(data.path.js);
      else
        data.scripts.forEach(function (source) { ml += self.script(source); });
    });
  }
  return ml;
};

StaticBuild.prototype.bundleCss = 
function (nameOrNames) {
  return this.bundles(nameOrNames, 'css');
};

StaticBuild.prototype.bundleJs = 
function (nameOrNames) {
  return this.bundles(nameOrNames, 'js');
};

StaticBuild.prototype.createBundle =
function (name, data) {
  var basePath = '/lib/$(bundle)';
  var targetFile = basePath + '/$(bundleRev)';
  data = lodash.merge({
    assets: [],
    path: {
      assets: basePath,
      css: targetFile + '.css',
      js: targetFile + '.js',
      target: targetFile
    },
    scripts: [],
    styles: []
  }, data);
  this.bundle[name] = data;
  return data;
};

StaticBuild.prototype.removeBundle = 
function (name) {
  delete this.bundle[name];
};

StaticBuild.prototype.saveBundles =
function () {
  var build = this;
  var savefilepath = build.bundlefilepath || build.filepath;
  var text;
  var data;
  var err;
  console.log('Saving bundles to: ' + savefilepath);
  //console.dir(this.bundle, { depth: null });
  try {
    if (build.bundlefile) {
      // Using a separate bundlefile. No need to read it in to overwrite it.
      data = build.bundle;
    } else {
      // Parse the staticbuild.config file and just update the bundles object.
      text = fs.readFileSync(savefilepath);
      data = JSON.parse(text);
      data.bundle = build.bundle;
    }
    // Write out the new file with JSON indented 2 spaces.
    text = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(savefilepath, text);
  } catch (ex) {
    err = ex;
    console.log('Error saving bundles: ' + err);
  }
  if (!err)
    console.log('OK: Bundles saved.');
};

// #endregion
