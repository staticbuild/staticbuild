# staticbuild API Reference

## StaticBuild class

Example

```js
var StaticBuild = require('staticbuild');
var build = new StaticBuild('./staticbuild.json');

// print relative path to src dir, e.g. 'src/x/y/z.js'
console.log(build.src('/x/y/z.js'));
```


* [StaticBuild](#StaticBuild)
  * [new StaticBuild(pathOrOpt, [opt])](#new_StaticBuild_new)
  * [.verbose](#StaticBuild+verbose)
  * [.dev](#StaticBuild+dev)
  * [.devServer](#StaticBuild+devServer)
    * [.host](#StaticBuild+devServer.host)
    * [.port](#StaticBuild+devServer.port)
    * [.restart](#StaticBuild+devServer.restart)
    * [.restartDelay](#StaticBuild+devServer.restartDelay)
  * [.baseDir](#StaticBuild+baseDir)
  * [.destDir](#StaticBuild+destDir)
  * [.fileName](#StaticBuild+fileName)
  * [.filePath](#StaticBuild+filePath)
  * [.ignore](#StaticBuild+ignore)
  * [.pathMap](#StaticBuild+pathMap)
  * [.pathTokens](#StaticBuild+pathTokens)
  * [.sourceDir](#StaticBuild+sourceDir)
  * [.packageFile](#StaticBuild+packageFile)
  * [.pkg](#StaticBuild+pkg)
  * [.pkgVer](#StaticBuild+pkgVer)
  * [.pkgVerHash](#StaticBuild+pkgVerHash)
  * [.usePkgVerHashDefault](#StaticBuild+usePkgVerHashDefault)
  * [.versionHash](#StaticBuild+versionHash)
  * [.versionHasher](#StaticBuild+versionHasher)
  * [.versionHashIds](#StaticBuild+versionHashIds)
  * [.defaultLocale](#StaticBuild+defaultLocale)
  * [.i18n](#StaticBuild+i18n)
  * [.locale](#StaticBuild+locale)
  * [.locales](#StaticBuild+locales)
  * [.localesConfigured](#StaticBuild+localesConfigured)
  * [.localesDir](#StaticBuild+localesDir)
  * [.defaultEngineName](#StaticBuild+defaultEngineName)
  * [.engine](#StaticBuild+engine)
  * [.autoContext](#StaticBuild+autoContext)
  * [.contextBuildVar](#StaticBuild+contextBuildVar)
  * [.context](#StaticBuild+context)
  * [.contextFile](#StaticBuild+contextFile)
  * [.defaultView](#StaticBuild+defaultView)
  * [.favicon](#StaticBuild+favicon)
  * [.errors](#StaticBuild+errors)
  * [.info](#StaticBuild+info)
  * [.warnings](#StaticBuild+warnings)
  * [.autoMinSrc](#StaticBuild+autoMinSrc)
  * [.bundle](#StaticBuild+bundle)
  * [.bundlePath](#StaticBuild+bundlePath)
  * [.bundling](#StaticBuild+bundling)
  * [.versionToHashId(version)](#StaticBuild+versionToHashId) ⇒ <code>string</code>
  * [.versionToInt(version)](#StaticBuild+versionToInt) ⇒ <code>number</code>
  * [.translate([str], [etc])](#StaticBuild+translate) ⇒ <code>string</code>
  * [.translateNumeric(singular, plural, value)](#StaticBuild+translateNumeric) ⇒ <code>string</code>
  * [.trySetLocale(locale, errback)](#StaticBuild+trySetLocale) ⇒ <code>boolean</code>
  * [.dest(pattern)](#StaticBuild+dest) ⇒ <code>string</code>
  * [.destLocale(pattern)](#StaticBuild+destLocale)
  * [.fsPath(pathStr)](#StaticBuild+fsPath) ⇒ <code>string</code>
  * [.getPathMapping(pathType, pathStr)](#StaticBuild+getPathMapping) ⇒ <code>object</code>
  * [.getWatchPaths()](#StaticBuild+getWatchPaths) ⇒ <code>Array.&lt;string&gt;</code>
  * [.notPath(pathStr)](#StaticBuild+notPath) ⇒ <code>string</code>
  * [.relativePath(targetPath)](#StaticBuild+relativePath) ⇒ <code>string</code>
  * [.relativePattern(basePath, pattern)](#StaticBuild+relativePattern) ⇒ <code>string</code>
  * [.resolvePath(targetPath)](#StaticBuild+resolvePath) ⇒ <code>string</code>
  * [.resolveSrcPath(srcPath)](#StaticBuild+resolveSrcPath) ⇒ <code>string</code>
  * [.runtimePath(pathStr, [opt])](#StaticBuild+runtimePath) ⇒ <code>string</code>
  * [.src(pattern)](#StaticBuild+src) ⇒ <code>string</code>
  * [.writeFileSync()](#StaticBuild+writeFileSync)
  * [.link(srcPath)](#StaticBuild+link) ⇒ <code>string</code>
  * [.script(srcPath)](#StaticBuild+script) ⇒ <code>string</code>
  * [.bundledCss(name, resultPath)](#StaticBuild+bundledCss)
  * [.bundledCssInStream(name, logger)](#StaticBuild+bundledCssInStream) ⇒ <code>stream.Transform</code>
  * [.bundledJs(name, resultPath)](#StaticBuild+bundledJs)
  * [.bundledJsInStream(name, logger)](#StaticBuild+bundledJsInStream) ⇒ <code>stream.Transform</code>
  * [.bundles(nameOrNames, sourceType)](#StaticBuild+bundles) ⇒ <code>string</code>
  * [.createBundle(name, data)](#StaticBuild+createBundle) ⇒ <code>object</code>
  * [.cssBundles(nameOrNames)](#StaticBuild+cssBundles) ⇒ <code>string</code>
  * [.findMinifiedFromSource(bundleItem)](#StaticBuild+findMinifiedFromSource) ⇒ <code>string</code> &#124; <code>undefined</code>
  * [.getBundleInfo(name, sourceType)](#StaticBuild+getBundleInfo) ⇒
  * [.getBundleMinified(name, sourceType)](#StaticBuild+getBundleMinified) ⇒ <code>Array.&lt;string&gt;</code>
  * [.getBundleSources(name, sourceType)](#StaticBuild+getBundleSources) ⇒ <code>Array.&lt;string&gt;</code>
  * [.getBundleSourcesOrMinified(name, sourceType)](#StaticBuild+getBundleSourcesOrMinified) ⇒ <code>Array.&lt;string&gt;</code>
  * [.jsBundles(nameOrNames)](#StaticBuild+jsBundles) ⇒ <code>string</code>
  * [.removeBundle(name)](#StaticBuild+removeBundle)
  * [.saveBundles()](#StaticBuild+saveBundles)

<a name="new_StaticBuild_new"></a>
### new StaticBuild(pathOrOpt, [opt])
Creates a new StaticBuild.


| Param | Type | Description |
| --- | --- | --- |
| pathOrOpt | <code>string</code> &#124; <code>object</code> | Path string or options object. |
| [opt] | <code>object</code> | Options object. |
| opt.path | <code>string</code> | Path to a configuration file. |
| [opt.bundling] | <code>boolean</code> | True if bundling is active. |
| [opt.dev] | <code>boolean</code> | True if dev mode is active. |
| [opt.verbose] | <code>string</code> &#124; <code>number</code> | True to or a positive number to enable verbose logging. |
| [opt.restart] | <code>boolean</code> | True to enable restarting dev mode. |
| [opt.restartDelay] | <code>number</code> | Millisecond delay before restart. |

<a name="StaticBuild+verbose"></a>
### staticBuild.verbose
True or a Number to set the verbosity level.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+dev"></a>
### staticBuild.dev
True if dev mode is active.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+devServer"></a>
### staticBuild.devServer
The dev server configuration.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  

* [.devServer](#StaticBuild+devServer)
  * [.host](#StaticBuild+devServer.host)
  * [.port](#StaticBuild+devServer.port)
  * [.restart](#StaticBuild+devServer.restart)
  * [.restartDelay](#StaticBuild+devServer.restartDelay)

<a name="StaticBuild+devServer.host"></a>
#### devServer.host
Host name or ip address.

**Kind**: static property of <code>[devServer](#StaticBuild+devServer)</code>  
<a name="StaticBuild+devServer.port"></a>
#### devServer.port
Port number.

**Kind**: static property of <code>[devServer](#StaticBuild+devServer)</code>  
<a name="StaticBuild+devServer.restart"></a>
#### devServer.restart
True if restart is enabled.

**Kind**: static property of <code>[devServer](#StaticBuild+devServer)</code>  
<a name="StaticBuild+devServer.restartDelay"></a>
#### devServer.restartDelay
Number of milliseconds delay on file-watch triggered restarts.

**Kind**: static property of <code>[devServer](#StaticBuild+devServer)</code>  
<a name="StaticBuild+baseDir"></a>
### staticBuild.baseDir
Path to the directory containing the build config file.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+destDir"></a>
### staticBuild.destDir
Path to the destination directory.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+fileName"></a>
### staticBuild.fileName
Name of the build config file.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+filePath"></a>
### staticBuild.filePath
Path to the build config file (includes fileName).

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+ignore"></a>
### staticBuild.ignore
Globs of file paths to ignore.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+pathMap"></a>
### staticBuild.pathMap
Contains paths that are mapped to the source directory.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+pathTokens"></a>
### staticBuild.pathTokens
Sets of tokens for replacing different items in file or url paths.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+sourceDir"></a>
### staticBuild.sourceDir
Path to the source directory.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+packageFile"></a>
### staticBuild.packageFile
Path to the package file.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+pkg"></a>
### staticBuild.pkg
Data from package.json

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+pkgVer"></a>
### staticBuild.pkgVer
Package Version

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+pkgVerHash"></a>
### staticBuild.pkgVerHash
Package Version Hashid

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+usePkgVerHashDefault"></a>
### staticBuild.usePkgVerHashDefault
True if pkgVerHash should be used when replacing 
pathTokens.packageVersionDefault.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+versionHash"></a>
### staticBuild.versionHash
Configuration for hashing version strings.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+versionHasher"></a>
### staticBuild.versionHasher
An instance of hashids or compatible: `{String encode(Number)}`.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+versionHashIds"></a>
### staticBuild.versionHashIds
Cache of hashed version strings.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+defaultLocale"></a>
### staticBuild.defaultLocale
Id of the default locale.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+i18n"></a>
### staticBuild.i18n
The i18n module used to provide translate and other functions.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+locale"></a>
### staticBuild.locale
Id of the current locale.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+locales"></a>
### staticBuild.locales
Array of available locale ids.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+localesConfigured"></a>
### staticBuild.localesConfigured
True if locales have been supplied from the config file.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+localesDir"></a>
### staticBuild.localesDir
Path to the locales directory containing translations.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+defaultEngineName"></a>
### staticBuild.defaultEngineName
Name of the default view engine.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+engine"></a>
### staticBuild.engine
Contains view engine configurations.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+autoContext"></a>
### staticBuild.autoContext
True if a view context should be created automatically.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+contextBuildVar"></a>
### staticBuild.contextBuildVar
Name of the variable to expose StaticBuild in the view context.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+context"></a>
### staticBuild.context
The view context.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+contextFile"></a>
### staticBuild.contextFile
Path to a separate file containing the view context.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+defaultView"></a>
### staticBuild.defaultView
Name of the default view file (without file extension).

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+favicon"></a>
### staticBuild.favicon
Path to a favicon.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+errors"></a>
### staticBuild.errors
Array of errors or error messages.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+info"></a>
### staticBuild.info
Array of information messages.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+warnings"></a>
### staticBuild.warnings
Array of warning messages.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+autoMinSrc"></a>
### staticBuild.autoMinSrc
True if pre-minified sources should be located by default.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+bundle"></a>
### staticBuild.bundle
Collection of bundles.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+bundlePath"></a>
### staticBuild.bundlePath
Relative path where bundled files should be placed by default.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+bundling"></a>
### staticBuild.bundling
True if the bundle should be rendered instead of the source paths.

**Kind**: instance property of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+versionToHashId"></a>
### staticBuild.versionToHashId(version) ⇒ <code>string</code>
Returns a hash of the given version using Hashids.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - The hash value.  
**See**: https://github.com/ivanakimov/hashids.node.js  

| Param | Type | Description |
| --- | --- | --- |
| version | <code>string</code> | A version string, e.g. '1.0.1'. |

<a name="StaticBuild+versionToInt"></a>
### staticBuild.versionToInt(version) ⇒ <code>number</code>
Returns the given version as an integer.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>number</code> - The version as an integer.  
**See**: https://github.com/ivanakimov/hashids.node.js  

| Param | Type | Description |
| --- | --- | --- |
| version | <code>string</code> | A version string, e.g. '1.0.1'. |

<a name="StaticBuild+translate"></a>
### staticBuild.translate([str], [etc]) ⇒ <code>string</code>
Applies the i18n translate method (`__`).

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - The translation.  
**See**: https://github.com/mashpie/i18n-node#__  

| Param | Type | Description |
| --- | --- | --- |
| [str] | <code>string</code> &#124; <code>obj</code> | String or phrase object with mustache template. |
| [etc] |  | An object or primitive value to merge into the template. |

<a name="StaticBuild+translateNumeric"></a>
### staticBuild.translateNumeric(singular, plural, value) ⇒ <code>string</code>
Applies the i18n translate-numeric method (`__n`).

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - The translation.  
**See**: https://github.com/mashpie/i18n-node#__n  

| Param | Type | Description |
| --- | --- | --- |
| singular | <code>string</code> | The singular format string. |
| plural | <code>string</code> | The plural format string. |
| value | <code>number</code> | The number to translate. |

<a name="StaticBuild+trySetLocale"></a>
### staticBuild.trySetLocale(locale, errback) ⇒ <code>boolean</code>
Sets the current locale for i18n.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>boolean</code> - True if successful otherwise false.  
**See**: https://github.com/mashpie/i18n-node#setlocale  

| Param | Type | Description |
| --- | --- | --- |
| locale | <code>string</code> | The locale id string. |
| errback | <code>function</code> | A callback that accepts (err, locale); |

<a name="StaticBuild+dest"></a>
### staticBuild.dest(pattern) ⇒ <code>string</code>
Returns a relative path derived from the build's destDir.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - The relative destination path with pattern appended.  

| Param | Type | Description |
| --- | --- | --- |
| pattern | <code>string</code> | The path pattern within the destination. |

<a name="StaticBuild+destLocale"></a>
### staticBuild.destLocale(pattern)
Returns a relative path derived from the build's locale directory.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  

| Param | Type | Description |
| --- | --- | --- |
| pattern | <code>string</code> | The path pattern within the locale destination. |

<a name="StaticBuild+fsPath"></a>
### staticBuild.fsPath(pathStr) ⇒ <code>string</code>
Returns a filesystem path for the given path string, taking any pathMap 
mappings into account.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - The filesystem path.  

| Param | Type | Description |
| --- | --- | --- |
| pathStr | <code>string</code> | The path string. |

<a name="StaticBuild+getPathMapping"></a>
### staticBuild.getPathMapping(pathType, pathStr) ⇒ <code>object</code>
Returns true if the given url path is mapped.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>object</code> - The path mapping object with keys: 'fs', 'url'.  

| Param | Type | Description |
| --- | --- | --- |
| pathType | <code>string</code> | The type of pathStr ('fs', 'url'). |
| pathStr | <code>string</code> | The path to get the mapping for. |

<a name="StaticBuild+getWatchPaths"></a>
### staticBuild.getWatchPaths() ⇒ <code>Array.&lt;string&gt;</code>
Returns an array of paths outside of src that are watched in dev mode.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - An array of paths that are watched in dev mode.  
<a name="StaticBuild+notPath"></a>
### staticBuild.notPath(pathStr) ⇒ <code>string</code>
Returns a glob that excludes the given path string.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - The pathStr with exclusion pattern applied.  

| Param | Type | Description |
| --- | --- | --- |
| pathStr | <code>string</code> | The path to exclude. |

<a name="StaticBuild+relativePath"></a>
### staticBuild.relativePath(targetPath) ⇒ <code>string</code>
Returns a relative path derived from the build's baseDir.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - A relative path to targetPath.  

| Param | Type | Description |
| --- | --- | --- |
| targetPath | <code>string</code> | The path to get a relative path to. |

<a name="StaticBuild+relativePattern"></a>
### staticBuild.relativePattern(basePath, pattern) ⇒ <code>string</code>
Returns a relative path pattern derived from the build's baseDir. 
(e.g. '../path/to/##/#.js' but with asterisks instead of hashes)

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - A relative path pattern within baseDir.  

| Param | Type | Description |
| --- | --- | --- |
| basePath | <code>string</code> | The base path. |
| pattern | <code>string</code> | The glob pattern. |

<a name="StaticBuild+resolvePath"></a>
### staticBuild.resolvePath(targetPath) ⇒ <code>string</code>
Returns an absolute file-system path resolved from the build's baseDir.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - An absolute path to the targetPath.  

| Param | Type | Description |
| --- | --- | --- |
| targetPath | <code>string</code> | The path to resolve to. |

<a name="StaticBuild+resolveSrcPath"></a>
### staticBuild.resolveSrcPath(srcPath) ⇒ <code>string</code>
Returns an absolute file-system path resolved from sourceDir.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - Th absolute path to the given srcPath.  

| Param | Type | Description |
| --- | --- | --- |
| srcPath | <code>string</code> | The path to resolve. |

<a name="StaticBuild+runtimePath"></a>
### staticBuild.runtimePath(pathStr, [opt]) ⇒ <code>string</code>
Returns the given pathStr with pathTokens replaced for use at runtime.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - The pathStr with runtime path tokens replaced.  

| Param | Type | Description |
| --- | --- | --- |
| pathStr | <code>string</code> | The path string. |
| [opt] | <code>object</code> | Options. |
| [opt.bundle] | <code>string</code> | A bundle name for string replacement. |
| [opt.bundleVer] | <code>string</code> | A bundle version for string replacement. |
| [opt.bundlePath] | <code>string</code> | A bundle path for string replacement. |

<a name="StaticBuild+src"></a>
### staticBuild.src(pattern) ⇒ <code>string</code>
Returns a relative path derived from the build's sourceDir.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - A relative source directory path.  

| Param | Type | Description |
| --- | --- | --- |
| pattern | <code>string</code> | Path pattern within the source directory. |

<a name="StaticBuild+writeFileSync"></a>
### staticBuild.writeFileSync()
Do not use. This function is not finished.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
<a name="StaticBuild+link"></a>
### staticBuild.link(srcPath) ⇒ <code>string</code>
Returns HTML for a link tag with a dynamic href attribute.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - An HTML link tag string.  

| Param | Type | Description |
| --- | --- | --- |
| srcPath | <code>string</code> | Relative path to the css file. |

<a name="StaticBuild+script"></a>
### staticBuild.script(srcPath) ⇒ <code>string</code>
Returns HTML for a script tag with a dynamic src attribute.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - An HTML script tag string.  

| Param | Type | Description |
| --- | --- | --- |
| srcPath | <code>string</code> | Relative path to the js file. |

<a name="StaticBuild+bundledCss"></a>
### staticBuild.bundledCss(name, resultPath)
Stores the result path for the bundled css, for rendering later.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| resultPath | <code>string</code> | Path to the bundled file. |

<a name="StaticBuild+bundledCssInStream"></a>
### staticBuild.bundledCssInStream(name, logger) ⇒ <code>stream.Transform</code>
Stores the result path for the bundled css, for rendering later.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>stream.Transform</code> - A stream transform to capture the bundle file.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| logger | <code>object</code> | Object with log method to use for logging. |

<a name="StaticBuild+bundledJs"></a>
### staticBuild.bundledJs(name, resultPath)
Stores the result path for the bundled js, for rendering later.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| resultPath | <code>string</code> | Path to the bundled file. |

<a name="StaticBuild+bundledJsInStream"></a>
### staticBuild.bundledJsInStream(name, logger) ⇒ <code>stream.Transform</code>
Stores the result path for the bundled js, for rendering later.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>stream.Transform</code> - A stream transform to capture the bundle file.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| logger | <code>object</code> | Object with log method to use for logging. |

<a name="StaticBuild+bundles"></a>
### staticBuild.bundles(nameOrNames, sourceType) ⇒ <code>string</code>
Returns HTML for the given bundles name(s) with CSS link tags first, 
then JS script tags.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - HTML of link and script tags that comprise the bundle.  

| Param | Type | Description |
| --- | --- | --- |
| nameOrNames | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | Bundle name or array of names. |
| sourceType | <code>string</code> | The type of files to output ('css', 'js'). |

<a name="StaticBuild+createBundle"></a>
### staticBuild.createBundle(name, data) ⇒ <code>object</code>
Creates a new bundle within the build.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>object</code> - The bundle data.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| data | <code>object</code> | Data for the bundle. |

<a name="StaticBuild+cssBundles"></a>
### staticBuild.cssBundles(nameOrNames) ⇒ <code>string</code>
Returns CSS link tags HTML only for the given bundle name(s).

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - HTML of link tags that comprise the bundle.  

| Param | Type | Description |
| --- | --- | --- |
| nameOrNames | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | Bundle name or array of names. |

<a name="StaticBuild+findMinifiedFromSource"></a>
### staticBuild.findMinifiedFromSource(bundleItem) ⇒ <code>string</code> &#124; <code>undefined</code>
If bundle item has no min path, finds one, updates the item and returns.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> &#124; <code>undefined</code> - The minified path, if found.  

| Param | Type | Description |
| --- | --- | --- |
| bundleItem | <code>object</code> | The bundle item with src to find min from. |

<a name="StaticBuild+getBundleInfo"></a>
### staticBuild.getBundleInfo(name, sourceType) ⇒
Returns an object containing information about the bundle. 
e.g. `{name,data,min,minif,sources,dest,fileName,relFile,relDir}`

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: The bundle info.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| sourceType | <code>string</code> | The type of files to output ('css', 'js'). |

<a name="StaticBuild+getBundleMinified"></a>
### staticBuild.getBundleMinified(name, sourceType) ⇒ <code>Array.&lt;string&gt;</code>
Returns just the min paths of the given bundle name.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of pre-minified file paths for a bundle.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| sourceType | <code>string</code> | The type of files to output ('css', 'js'). |

<a name="StaticBuild+getBundleSources"></a>
### staticBuild.getBundleSources(name, sourceType) ⇒ <code>Array.&lt;string&gt;</code>
Returns just the src paths of the given bundle name.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of source paths for a bundle.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| sourceType | <code>string</code> | The type of files to output ('css', 'js'). |

<a name="StaticBuild+getBundleSourcesOrMinified"></a>
### staticBuild.getBundleSourcesOrMinified(name, sourceType) ⇒ <code>Array.&lt;string&gt;</code>
Returns the min (if any) OR src paths of the given bundle name.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - An array of source or pre-minified file paths for the 
bundle.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |
| sourceType | <code>string</code> | The type of files to output ('css', 'js'). |

<a name="StaticBuild+jsBundles"></a>
### staticBuild.jsBundles(nameOrNames) ⇒ <code>string</code>
Returns Javascript script tags HTML only for the given bundle name(s).

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  
**Returns**: <code>string</code> - HTML of script tags that comprise the bundle.  

| Param | Type | Description |
| --- | --- | --- |
| nameOrNames | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | Bundle name or array of names. |

<a name="StaticBuild+removeBundle"></a>
### staticBuild.removeBundle(name)
Removes a bundle from the build.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the bundle. |

<a name="StaticBuild+saveBundles"></a>
### staticBuild.saveBundles()
Saves bundles to the configuration filePath.

**Kind**: instance method of <code>[StaticBuild](#StaticBuild)</code>  

