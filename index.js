'use strict';

// #region Imports
var fs = require('fs');
var Hashids = require('hashids');
var i18n = require('i18n');
var istype = require('type-check').typeCheck;
var lodash = require('lodash');
var path = require('path');
var requireNew = require('require-new');
var stream = require('stream');
// #endregion

/** Creates a new StaticBuild object. @constructor */
function StaticBuild(pathOrOpt, opt) {
  // #region Non-Constructor Call Handling
  if (!(this instanceof StaticBuild))
    return new StaticBuild(pathOrOpt, opt);
  // #endregion
  
  opt = normalizeOptions(pathOrOpt, opt);
  
  // #region Base
  /** True or a Number to set the verbosity level. */
  this.verbose = opt.verbose || false;
  // #endregion
  
  // #region Dev Server
  // TODO: Create a cli option for host_AND_port; use it to override config.
  /** True if dev mode is active. */
  this.dev = opt.dev || false;
  /** The dev server configuration. */
  this.devServer = {
    /** Host name or ip address. */
    host: undefined,
    /** Port number. */
    port: 8080,
    /** True if restart is enabled. */
    restart: istype('Boolean', opt.restart) ? opt.restart : false,
    /** Number of milliseconds delay on file-watch triggered restarts. */
    restartDelay: istype('Number', opt.restartDelay) ? opt.restartDelay : 0
  };
  // #endregion
  
  // #region Paths
  /** Path to the directory containing the build config file. */
  this.baseDir = opt.baseDir || process.cwd();
  /** Path to the destination directory. */
  this.destDir = 'dist';
  /** Name of the build config file. */
  this.fileName = opt.fileName || 'staticbuild.json';
  /** Path to the build config file (includes fileName). */
  this.filePath = opt.filePath || '';
  /** Globs of file paths to ignore. */
  this.ignore = [
    '.gitignore',
    '*.layout.htm',
    '*.part.htm',
    '*.map'
  ];
  /** Contains paths that are mapped to the source directory. */
  this.pathMap = {
    bower: { fs: 'bower_components' }
  };
  /** Sets of tokens for replacing different items in file or url paths. */
  this.pathTokens = {
    bundleName: [
      /\$\(bundle\)/g
    ],
    bundleVer: [
      /\$\(bundleVer\)/g
    ],
    bundlePath: [
      /\$\(bundlePath\)/g
    ],
    packageVersionDefault: [
      /\$\(pkgVer\)/g
    ],
    packageVersionHashid: [
      /\$\(pkgVerHash\)/g
    ],
    packageVersionNumber: [
      /\$\(pkgVerNum\)/g
    ]
  };
  /** Path to the source directory. */
  this.sourceDir = 'src';
  // #endregion
  
  // #region Package
  /** Path to the package file. */
  this.packageFile = 'package.json';
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
  
  // #region Version Hashing
  /** Configuration for hashing version strings. */
  this.versionHash = {
    alphabet: '0123456789abcdefghijklmnopqrstuvwxyz',
    minLength: 4,
    salt: 'BpoIsQlrssEz56uUbfgLu5KNBkoCJiyY'
  };
  /** An instance of hashids or compatible: `{String encode(Number)}`. */
  this.versionHasher = null;
  /** Cache of hashed version strings. */
  this.versionHashIds = {};
  // #endregion
  
  // #region Locales
  /** Id of the default locale. */
  this.defaultLocale = 'en';
  /** The i18n module used to provide translate and other functions. */
  this.i18n = i18n;
  /** Id of the current locale. */
  this.locale = 'en';
  /** Array of available locale ids. */
  this.locales = ['en'];
  /** True if locales have been supplied from the config file. */
  this.localesConfigured = false;
  /** Path to the locales directory containing translations. */
  this.localesDir = 'locales';
  // #endregion
  
  // #region Engine
  /** Name of the default view engine. */
  this.defaultEngineName = 'jade';
  /** Contains view engine configurations. */
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
      extensionsFile: '',
      filters: undefined,
      filtersFile: '',
      functions: undefined,
      options: { autoescape: true }
    }
  };
  // #endregion
  
  // #region Views
  /** True if a view context should be created automatically.*/
  this.autoContext = true;
  /** Name of the variable to expose StaticBuild in the view context. */
  this.contextBuildVar = 'build';
  /** The view context. */
  this.context = {};
  /** Path to a separate file containing the view context. */
  this.contextFile = '';
  /** Name of the default view file (without file extension). */
  this.defaultView = 'index';
  /** Path to a favicon. */
  this.favicon = 'favicon.ico';
  // #endregion
  
  // #region Status
  /** Array of errors or error messages. */
  this.errors = [];
  /** Array of information messages. */
  this.info = [];
  /** Array of warning messages. */
  this.warnings = [];
  // #endregion
  
  // #region Bundling
  /** True if pre-minified sources should be located by default. */
  this.autoMinSrc = true;
  /** Collection of bundles. */
  this.bundle = {};
  /** True if the bundle should be rendered instead of the source paths. */
  this.bundling = !this.dev || opt.bundling === true;
  // #endregion
  
  configure(this);
  StaticBuild.current = this;
  load(this);
}
module.exports = StaticBuild;

// #region Options

function fileFromPathOption(opt) {
  if (opt.filePath !== undefined)
    return true;
  if (opt.path === undefined)
    return false;
  try {
    var stat = fs.statSync(opt.path);
    if (stat.isFile()) {
      opt.filePath = path.resolve(opt.path);
      return true;
    }
  } catch (err) {
  }
  return false;
}

function normalizeOptions(pathOrOpt, opt) {
  var pathStr = '';
  if (istype('String', pathOrOpt))
    pathStr = pathOrOpt.trim();
  else
    opt = pathOrOpt;
  opt = lodash.assign({
    path: pathStr,
    bundling: true,
    dev: false,
    verbose: 0,
    restart: false,
    restartDelay: 0
  }, opt);
  if (!istype('String', opt.path))
    opt.path = '';
  if (!istype('Boolean', opt.bundling))
    opt.bundling = true;
  if (!istype('Boolean', opt.dev))
    opt.dev = false;
  if (!(istype('Number', opt.verbose) || istype('Boolean', opt.verbose)))
    opt.verbose = 0;
  if (!istype('Boolean', opt.restart))
    opt.restart = false;
  if (!istype('Number', opt.restartDelay))
    opt.restartDelay = 0;
  normalizePathOptions(opt);
  return opt;
}

function normalizePathOptions(opt) {
  if (fileFromPathOption(opt)) {
    opt.baseDir = path.resolve(path.dirname(opt.filePath));
    opt.fileName = path.basename(opt.filePath);
  }
  else if (opt.path !== undefined) {
    opt.fileName = opt.fileName || 'staticbuild.json';
    opt.baseDir = path.resolve(opt.baseDir || process.cwd(), opt.path);
    opt.filePath = path.join(opt.baseDir, opt.fileName);
  }
}

// #endregion

// #region Cache Busting

/** Creates a hash of the given version using Hashids. */
StaticBuild.prototype.versionToHashId = 
function (version) {
  var vh = this.versionHashIds[version];
  if (vh)
    return vh;
  var vi = StaticBuild.versionToInt(version);
  vh = this.versionHasher.encode(vi);
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
/** Converts the given version number to an integer. */
StaticBuild.versionToInt = versionToInt;
/** Converts the given version number to an integer. */
StaticBuild.prototype.versionToInt = versionToInt;

// #endregion

// #region Configuration

function configure(build) {
  // Configure from file.
  var data = build.tryRequireNew(build.filePath);
  if (!data)
    return;
  configureBase(build, data);
  configurePaths(build, data);
  configurePackage(build, data);
  configureDevServer(build, data);
  configureEngine(build, data);
  configureHashids(build, data);
  configureLocales(build, data);
  configureBundles(build, data);
  configureViews(build, data);
}

function configureBase(build, data) {
  // verbose
  // - Can only be turned ON from build, not off.
  if (data.verbose === true || data.verbose > 0)
    build.verbose = data.verbose;
}

function configureBundles(build, data) {
  var bundleData;
  // bundling is already set from the bincmd cli args for dev mode.
  if (!build.dev && istype('Boolean', data.bundling))
    build.bundling = data.bundling;
  if (istype('Object', data.bundle))
    bundleData = data.bundle;
  if (bundleData)
    lodash.forEach(bundleData, function (item, name) {
      build.createBundle(name, item);
    });
}

function configureDevServer(build, data) {
  // dev
  // - Not configurable via file data. See StaticBuild constructor argument
  // `opt.dev`, which is applied to the StaticBuild in `configure`.
  //
  data = data.devServer;
  if (!istype('Object', data))
    return;
  // host
  if (istype('String', data.host))
    build.devServer.host = data.host;
  // port
  if (istype('Number', data.port))
    build.devServer.port = data.port;
  // restart & restartDelay are set in the StaticBuild constructor.
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
  var ch = build.versionHash;
  var hi = data.versionHash;
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
  build.versionHasher = new Hashids(
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
  // localesDir
  if (istype('String', data.localesDir))
    build.localesDir = data.localesDir;
  
  // locales
  if (istype('Array', data.locales)) {
    build.locales = Array.prototype.slice.call(data.locales);
    build.localesConfigured = true;
  }
}

function configureNunjucks(build, data) {
  var nunjucks = data.nunjucks;
  if (!istype('Object', nunjucks))
    return;
  // extension
  if (istype('String', nunjucks.extension))
    build.engine.nunjucks.extension = nunjucks.extension;
  // extensions | extensionsFile
  if (istype('String', nunjucks.extensions))
    build.engine.nunjucks.extensionsFile = nunjucks.extensions;
  else if (istype('String', nunjucks.extensionsFile))
    build.engine.nunjucks.extensionsFile = nunjucks.extensionsFile;
  // filters | filtersFile
  if (istype('String', nunjucks.filters))
    build.engine.nunjucks.filtersFile = nunjucks.filters;
  else if (istype('String', nunjucks.filtersFile))
    build.engine.nunjucks.filtersFile = nunjucks.filtersFile;
  // options
  if (istype('Object', nunjucks.options))
    lodash.merge(build.engine.nunjucks.options, nunjucks.options);
}

function configurePackage(build, data) {
  // package | packageFile
  if (istype('String', data['package']))
    build.packageFile = data['package'];
  else if (istype('String', data.packageFile))
    build.packageFile = data.packageFile;
}

function configurePaths(build, data) {
  // source | sourceDir
  if (istype('String', data.sourceDir))
    build.sourceDir = data.sourceDir;
  else if (istype('String', data.source))
    build.sourceDir = data.source;
  // dest | destDir
  if (istype('String', data.destDir))
    build.destDir = data.destDir;
  else if (istype('String', data.dest))
    build.destDir = data.dest;
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
  // autoContext
  if (istype('Boolean', data.autoContext))
    build.autoContext = data.autoContext;
  // contextBuildVar
  if (istype('String', data.contextBuildVar))
    build.contextBuildVar = data.contextBuildVar;
  // context | contextFile
  if (istype('String', data.context))
    build.contextFile = data.context;
  else if (istype('String', data.contextFile))
    build.contextFile = data.contextFile;
  else if (istype('Object', data.context)) {
    build.contextFile = null;
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
  if (build.packageFile)
    build.packageFile = build.resolvePath(build.packageFile);
  if (build.sourceDir)
    build.sourceDir = build.resolvePath(build.sourceDir);
  if (build.destDir)
    build.destDir = build.resolvePath(build.destDir);
  if (build.localesDir)
    build.localesDir = build.resolvePath(build.localesDir);
  if (build.engine.nunjucks.extensionsFile)
    build.engine.nunjucks.extensionsFile = 
      build.resolvePath(build.engine.nunjucks.extensionsFile);
  if (build.engine.nunjucks.filtersFile)
    build.engine.nunjucks.filtersFile = 
      build.resolvePath(build.engine.nunjucks.filtersFile);
  if (build.contextFile)
    build.globalsfile = build.resolvePath(build.contextFile);
  // Load stuff.
  loadPackage(build);
  loadLocales(build);
  loadViewContext(build);
  loadNunjucksFiles(build);
}

function loadLocales(build) {
  if (!build.localesConfigured)
    loadLocalesFromFs(build);
  i18n.configure({
    extension: '.json',
    indent: '  ',
    locales: build.locales,
    defaultLocale: build.defaultLocale,
    directory: build.localesDir,
    objectNotation: true,
    prefix: '',
    updateFiles: true
  });
  i18n.setLocale(build.locale);
}

function loadLocalesFromFs(build) {
  // Load locale names from localesDir if it exists.
  var localesPath = path.resolve(build.baseDir, build.localesDir);
  var localesFromFs;
  if (!fs.existsSync(localesPath))
    return;
  // Get the file names of all the .json files in the directory.
  localesFromFs = fs.readdirSync(localesPath);
  localesFromFs = lodash.chain(localesFromFs)
    .map(function fparse(f) { return path.parse(f); })
    .filter(function fjson(f) { return f.ext === '.json'; })
    .map(function fname(f) { return f.name; })
    .value();
  if (!localesFromFs.length)
    return;
  // Assign the file names (minus extension) as locale names.
  build.locales = Array.prototype.slice.call(localesFromFs);
  // Ensure that the current locale is still valid.
  if (build.locales.indexOf(build.locale) < 0)
    build.locale = build.locales[0];
  // Ensure that the default locale is still valid.
  if (build.locales.indexOf(build.defaultLocale) < 0)
    build.defaultLocale = build.locale;
}

function loadPackage(build) {
  if (!build.packageFile)
    return;
  var data = build.tryRequireNew(build.packageFile);
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
  if (nunjucks.extensionsFile)
    loaded.extensions = build.tryRequireNew(nunjucks.extensionsFile);
  if (nunjucks.filtersFile)
    loaded.filters = build.tryRequireNew(nunjucks.filtersFile);
  
  if (loaded.extensions)
    nunjucks.extensions = lodash.merge(nunjucks.extensions, loaded.extensions);
  
  nunjucks.filters = 
    require('./lib/nunjucks/filters.js').createForBuild(build);
  if (loaded.filters)
    nunjucks.filters = lodash.merge(nunjucks.filters, loaded.filters);
  
  // Some core functions specialized for nunjucks.
  nunjucks.functions = 
    require('./lib/nunjucks/functions.js').createForBuild(build);
}

function loadViewContext(build) {
  var context = build.context;
  if (build.contextFile)
    context = build.context = 
      build.tryRequireNew(build.contextFile) || context;
  if (build.autoContext) {
    // Add some stuff to the global context.
    if (build.contextBuildVar)
      context[build.contextBuildVar] = build;
    context.t = build.translate.bind(build);
    context.tn = build.translateNumeric.bind(build);
  }
}

// #endregion

// #region Locales

/** Applies the i18n translate method (`__`). */
StaticBuild.prototype.translate = 
function (str, etc) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged(this);
  return i18n.__.apply(i18n, args);
};

/** Applies the i18n translate-numeric method (`__n`). */
StaticBuild.prototype.translateNumeric = 
function (singular, plural, value) {
  /*jshint unused:false*/
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged(this);
  return i18n.__n.apply(i18n, args);
};

/** Sets the current locale for the build. */
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
  updateLocaleIfChanged(this);
  if (errback)
    errback(null, locale);
  return true;
};

function updateLocaleIfChanged(build) {
  if (build.locale === i18n.locale)
    return;
  i18n.setLocale(build.locale);
}

// #endregion

// #region Paths

/** Returns the pathStr with the given value appended to the fileName, before 
 * the extension. */
function appendFilename(pathStr, valueToAppend) {
  var pfile = path.parse(pathStr);
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

/** Returns the pathStr with the given part appended to the fileName, before 
 * the extension, using a standard dash as a delimiter. */
function appendFilenamePart(pathStr, part) {
  return StaticBuild.appendFilename(pathStr, '-' + part);
}
StaticBuild.appendFilenamePart = appendFilenamePart;
StaticBuild.prototype.appendFilenamePart = appendFilenamePart;

/** Returns a relative path derived from the build's destDir. */
StaticBuild.prototype.dest =
function (pattern) {
  return this.relativePattern(this.destDir, pattern);
};

/** Returns a relative path derived from the build's locale directory.*/
StaticBuild.prototype.destLocale =
function (pattern) {
  return this.relativePattern(path.join(this.destDir, this.locale), pattern);
};

/** Returns a filesystem path for the given path string, taking any pathMap
 * mappings into account. */
StaticBuild.prototype.fsPath = function (pathStr) {
  var mapping = this.getPathMapping('url', pathStr);
  if (!mapping)
    return this.src(pathStr);
  return mapping.fs + pathStr.substr(mapping.url.length);
};

/** Returns true if the given url path is mapped. */
StaticBuild.prototype.getPathMapping = 
function (pathType, pathStr) {
  if (!pathStr)
    return;
  function isMappedFrom(mapping) {
    var fromPath = mapping[pathType];
    return (fromPath && fromPath.length > 0) && 
      (pathStr.substr(0, fromPath.length) === fromPath);
  }
  return lodash.find(this.pathMap, isMappedFrom);
};

/** Returns an array of paths outside of src that are watched in dev mode. */
StaticBuild.prototype.getWatchPaths = 
function () {
  var paths = [];
  if (this.contextFile)
    paths.push(this.contextFile);
  if (this.engine.nunjucks.extensionsFile)
    paths.push(this.engine.nunjucks.extensionsFile);
  if (this.engine.nunjucks.filtersFile)
    paths.push(this.engine.nunjucks.filtersFile);
  if (this.packageFile)
    paths.push(this.packageFile);
  return paths;
};

/** Returns a glob that excludes the given path string. */
StaticBuild.prototype.notPath = function (pathStr) {
  return '!' + pathStr;
};

/** Returns a relative path derived from the build's baseDir. */
StaticBuild.prototype.relativePath =
function (basePath) {
  return path.relative(this.baseDir, basePath).replace('\\', '/');
};

/** Returns a relative path pattern derived from the build's baseDir.
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

/** Returns an absolute file-system path resolved from the build's baseDir. */
StaticBuild.prototype.resolvePath = 
function (basePath) {
  return path.resolve(this.baseDir, basePath);
};

/** Returns an absolute file-system path resolved from sourceDir. */
StaticBuild.prototype.resolveSrcPath = 
function (srcPath) {
  return path.resolve(this.sourceDir, srcPath);
};

/** Returns the given pathStr with pathTokens replaced for use at runtime. */
StaticBuild.prototype.runtimePath = 
function (pathStr, opt) {
  var defaultPkgVer;
  opt = lodash.assign({
    production: false
  }, opt);
  if (!this.dev || opt.production) {
    // Package Versions
    defaultPkgVer = (this.usePkgVerHashDefault ? 
      this.pkgVerHash : 
      this.pkgVer);
    pathStr = replaceAll(pathStr, 
      this.pathTokens.packageVersionDefault, 
      defaultPkgVer);
    pathStr = replaceAll(pathStr, 
      this.pathTokens.packageVersionHashid, 
      this.pkgVerHash);
    pathStr = replaceAll(pathStr, 
      this.pathTokens.packageVersionNumber, 
      this.pkgVer);
    // Bundles
    if (opt.bundle)
      pathStr = replaceAll(pathStr, 
        this.pathTokens.bundleName, 
        opt.bundle);
    if (opt.bundleVer)
      pathStr = replaceAll(pathStr, 
        this.pathTokens.bundleVer, 
        opt.bundleVer);
    if (opt.bundlePath)
      pathStr = replaceAll(pathStr, 
        this.pathTokens.bundlePath, 
        opt.bundlePath);
  }
  return pathStr;
};

/** Returns a relative path derived from the build's sourceDir. */
StaticBuild.prototype.src =
function (pattern) {
  return this.relativePattern(this.sourceDir, pattern);
};

/** Attempts to require an uncached instance of the given pathStr's module 
 * using require-new. */
function tryRequireNew(pathStr) {
  var build, errMsg;
  if (pathStr === undefined || pathStr === null)
    return;
  try {
    return requireNew(pathStr);
  } catch (err) {
    errMsg = err.code === 'MODULE_NOT_FOUND' ? 
        'File not found: ' + pathStr :
        'Error loading file ' + pathStr + ' - ' + err.toString();
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

/** Do not use. This function is not finished. */
StaticBuild.prototype.writeFileSync = 
function (tofile) {
  var INDENT = 2;
  
  tofile = tofile || 'staticbuild.json';
  
  var config = lodash.cloneDeep(this);
  
  //
  if (config.datafile)
    config.data = config.datafile;
  else
    config.data = '';
  
  // Make absolute paths relative.
  config.dest = path.relative(config.baseDir, config.destDir);
  config.localesDir = path.relative(config.baseDir, config.localesDir);
  config.source = path.relative(config.baseDir, config.sourceDir);
  
  // Delete object data.
  delete config.baseDir;
  delete config.destDir;
  delete config.dev;
  delete config.filePath;
  delete config.fileName;
  delete config.pkg;
  delete config.packageFile;
  delete config.sourceDir;
  delete config.verbose;
  
  delete config.versionHasher;
  delete config.datafile;
  delete config.locale;
  
  delete config.devServer;
  
  delete config.errors;
  delete config.info;
  delete config.warnings;
  
  var jsonStr = JSON.stringify(config, null, INDENT);
  
  fs.writeFileSync(tofile, jsonStr);
};

// #endregion

// #region HTML

/** Returns HTML for a link tag with a dynamic href attribute. */
StaticBuild.prototype.link =
function (srcPath) {
  srcPath = this.runtimePath(srcPath);
  var ml = '\n    ' +
    '<link rel="stylesheet" type="text/css" href="' + 
    srcPath + 
    '"/>';
  return ml;
};

/** Returns HTML for a script tag with a dynamic src attribute. */
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

/** Stores the result path for the bundled css, for rendering later. */
StaticBuild.prototype.bundledCss = function (name, resultPath) {
  this.bundle[name].result.css = resultPath;
};

/** Stores the result path for the bundled css, for rendering later. */
StaticBuild.prototype.bundledCssInStream = function (name, logger) {
  var passiveStream = new stream.Transform({ objectMode: true });
  var build = this;
  function getBundledCssInStream(file, unused, cb) {
    var bundle = build.bundle[name];
    var rpath = build.runtimePath(bundle.path.css, { bundle: name });
    rpath = path.dirname(rpath) + '/' + path.basename(file.path);
    build.bundledCss(name, rpath);
    if (logger)
      logger.log('Bundled  \'' + rpath + '\'');
    cb(null, file);
  }
  passiveStream._transform = getBundledCssInStream;
  return passiveStream;
};

/** Stores the result path for the bundled js, for rendering later. */
StaticBuild.prototype.bundledJs = function (name, resultPath) {
  this.bundle[name].result.js = resultPath;
};

/** Stores the result path for the bundled js, for rendering later. */
StaticBuild.prototype.bundledJsInStream = function (name, logger) {
  var passiveStream = new stream.Transform({ objectMode: true });
  var build = this;
  function getBundledJsInStream(file, unused, cb) {
    var bundle = build.bundle[name];
    var rpath = build.runtimePath(bundle.path.css, { bundle: name });
    rpath = path.dirname(rpath) + '/' + path.basename(file.path);
    build.bundledJs(name, rpath);
    if (logger)
      logger.log('Bundled  \'' + rpath + '\'');
    cb(null, file);
  }
  passiveStream._transform = getBundledJsInStream;
  return passiveStream;
};

/** Returns HTML for the given bundles name(s) with CSS link tags first, 
 * then JS script tags. */
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
      if (self.bundling)
        ml += self.link(data.result.css);
      else
        data.styles.forEach(function (item) { ml += self.link(item.src); });
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
      if (self.bundling)
        ml += self.script(data.result.js);
      else
        data.scripts.forEach(function (item) { ml += self.script(item.src); });
    });
  }
  return ml;
};

/** Creates a new bundle within the build. */
StaticBuild.prototype.createBundle =
function (name, data) {
  var basePath = '/lib/$(bundle)';
  // TODO: Support assets related to the scripts and styles. Make it easy to
  // let gulp rebase css urls or urls wherever (e.g. in html or js files).
  //data.assets = normalizeBundleItem(data.assets);
  data.scripts = normalizeBundleItem(data.scripts);
  data.styles = normalizeBundleItem(data.styles);
  data = lodash.merge({
    //assets: [
    // {
    // src: '/bower_components/bootstrap/fonts/**/*', 
    // dest: 'fonts/**/*'
    // }
    //],
    autoMinSrc: this.autoMinSrc,
    cdn: {
      css: '',
      js: ''
    },
    path: {
      base: basePath,
      css: basePath + '/styles.css',
      js: basePath + '/scripts.js'
    },
    result: {
      base: '',
      css: '',
      js: ''
    },
    scripts: [
      // {
      // src: '/bower_components/angular/angular.js', 
      // min: '/bower_components/angular/angular.min.js'
      // }
    ],
    styles: [
      // {
      // src: '/bower_components/bootstrap/dist/css/bootstrap.css'
      // }
    ]
  }, data);
  if (data.autoMinSrc) {
    lodash.forEach(data.scripts, this.findMinifiedFromSource, this);
    lodash.forEach(data.styles, this.findMinifiedFromSource, this);
  }
  this.bundle[name] = data;
  return data;
};

/** Returns CSS link tags HTML only for the given bundle name(s). */
StaticBuild.prototype.cssBundles = 
function (nameOrNames) {
  return this.bundles(nameOrNames, 'css');
};

/** If bundle item has no min path, finds one, updates the item and returns. */
StaticBuild.prototype.findMinifiedFromSource = function (bundleItem) {
  var pathStr = bundleItem.src;
  if (bundleItem.min || !pathStr)
    return;
  var extName = path.extname(pathStr);
  var minPath = pathStr.substr(0, pathStr.length - extName.length) + 
    '.min' + 
    extName;
  var minFsPath = this.fsPath(minPath);
  if (fs.existsSync(minFsPath)) {
    bundleItem.min = minPath;
    return minPath;
  }
};

/** Returns an object containing information about the bundle.
 * eg: `{name,data,min,minif,sources,dest,fileName,relFile,relDir}` */
StaticBuild.prototype.getBundleInfo = function (name, sourceType) {
  var fsPath = this.fsPath.bind(this);
  var notPath = this.notPath.bind(this);
  var min = lodash.map(this.getBundleMinified(name, sourceType), fsPath);
  var minIf = lodash.map(min, notPath);
  if (minIf.length === 0)
    minIf = true;
  var bi = {
    /** Name of the bundle. */
    name: name,
    /** Configuration data. */
    data: this.bundle[name],
    /** Source paths of pre-minified files. */
    min: min,
    /** Array of glob(s) to exclude pre-minified files OR True. For gulp-if. */
    minIf: minIf,
    /** Source paths to include in the bundle (including pre-minified). */
    sources: lodash.map(
      this.getBundleSourcesOrMinified(name, sourceType), 
      fsPath),
    /** Destination path. */
    dest: '',
    /** Destination file name. */
    fileName: '',
    /** Relative runtime path (url or src or dest). */
    relFile: '',
    /** Relative runtime directory path (url or src or dest). */
    relDir: ''
  };
  bi.relFile = this.runtimePath(bi.data.path[sourceType], { bundle: name });
  bi.relDir = path.dirname(bi.relFile);
  bi.dest = this.destLocale(bi.relFile);
  bi.fileName = path.basename(bi.relFile);
  return bi;
};

/** Returns just the min paths of the given bundle name. */
StaticBuild.prototype.getBundleMinified = function (name, sourceType) {
  var bundle = this.bundle[name];
  if (!bundle)
    throw new Error('Bundle not found: ' + name);
  var sources = [];
  if (bundle.styles.length > 0 && 
    (sourceType === undefined || sourceType === 'css')) {
    sources = sources.concat(
      lodash.chain(bundle.styles)
      .filter(getMinOfBundleItem)
      .map(getMinOfBundleItem)
      .value());
  }
  if (bundle.scripts.length > 0 && 
    (sourceType === undefined || sourceType === 'js')) {
    sources = sources.concat(
      lodash.chain(bundle.scripts)
      .filter(getMinOfBundleItem)
      .map(getMinOfBundleItem)
      .value());
  }
  return sources;
};

/** Returns just the src paths of the given bundle name. */
StaticBuild.prototype.getBundleSources = function (name, sourceType) {
  var bundle = this.bundle[name];
  if (!bundle)
    throw new Error('Bundle not found: ' + name);
  var sources = [];
  if (bundle.styles.length > 0 && 
    (sourceType === undefined || sourceType === 'css')) {
    sources = sources.concat(lodash.map(bundle.styles, getSrcOfBundleItem));
  }
  if (bundle.scripts.length > 0 && 
    (sourceType === undefined || sourceType === 'js')) {
    sources = sources.concat(lodash.map(bundle.scripts, getSrcOfBundleItem));
  }
  return sources;
};

/** Returns the min (if any) OR src paths of the given bundle name. */
StaticBuild.prototype.getBundleSourcesOrMinified = 
function (name, sourceType) {
  var bundle = this.bundle[name];
  if (!bundle)
    throw new Error('Bundle not found: ' + name);
  var sources = [];
  if (bundle.styles.length > 0 && 
    (sourceType === undefined || sourceType === 'css')) {
    sources = sources.concat(
      lodash.map(bundle.styles, getMinOrSrcOfBundleItem));
  }
  if (bundle.scripts.length > 0 && 
    (sourceType === undefined || sourceType === 'js')) {
    sources = sources.concat(
      lodash.map(bundle.scripts, getMinOrSrcOfBundleItem));
  }
  return sources;
};

function getMinOfBundleItem(item) {
  return item.min;
}

function getMinOrSrcOfBundleItem(item) {
  return item.min || item.src;
}

function getSrcOfBundleItem(item) {
  return item.src;
}

/** Returns Javascript script tags HTML only for the given bundle name(s). */
StaticBuild.prototype.jsBundles = 
function (nameOrNames) {
  return this.bundles(nameOrNames, 'js');
};

/** Converts array items that are String to `{ src: TheString }`. */
function normalizeBundleItem(items) {
  var i, len;
  if (!istype('Array', items))
    return;
  len = items.length;
  for (i = 0; i < len; i++)
    if (istype('String', items[i]))
      items[i] = { src: items[i] };
  return items;
}

/** Removes a bundle from the build. */
StaticBuild.prototype.removeBundle = 
function (name) {
  delete this.bundle[name];
};

/** Saves bundles to the configuration filePath. */
StaticBuild.prototype.saveBundles =
function () {
  var build = this;
  var savefilepath = build.filePath;
  var text;
  var data;
  var err;
  console.log('Saving bundles to: ' + savefilepath);
  //console.dir(this.bundle, { depth: null });
  try {
    //if (using_a_separate_file) {
    //  // Using a separate bundlefile. No need to read it in to overwrite it.
    //  data = build.bundle; } else {
    
    // Parse the staticbuild.config file and just update the bundle property.
    text = fs.readFileSync(savefilepath);
    data = JSON.parse(text);
    data.bundle = build.bundle;
    
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
