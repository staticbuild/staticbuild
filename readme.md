# Static Development Server

A basic front-end development server built with Express, less and nunjucks.

## Getting Started

Install

`npm install -g staticdev`

Run

`staticdev path/to/project`

or

`staticdev path/to/project/staticbuild.json`

## Project Directory

See `test/default-config-site` for an example.

The project directory should contain a `staticbuild.json` configuration file 
or be organized according to the default configuration. A project directory
organized according to the default-staticbuild.json configuration looks like 
this:

```
  /path/to/project
    - src/...
	- staticbuild.data.json
	- staticbuild.htm.js
	- [staticbuild.json]
```

The `src/` sub-directory is the root of the site which can contain static `.html`,
`.js` and `.css` files as well as `.less` and `.htm` (nunjucks) files.

## Default Configuration

The default configured template engine and css preprocessor are the only supported options right now.

Here is a look at the default configuration (at the time of 
this writing):

```json
{
  "verbose": false,
  "data": "staticbuild.data.json",
  "host": null,
  "port": 8080,
  "source": "src",
  "dest": "dist",
  "favicon": "favicon.ico",
  "template": {
    "index": "index",
    "engine": "nunjucks",
    "extension": "htm",
    "globals": "staticbuild.htm.js",
    "locals": false,
    "options": {
      "autoescape": true
    }
  },
  "css": {
    "preprocessor": "less",
    "map": {
      "enabled": true,
      "inline": false
    }
  },
  "ignore": [
    ".gitignore",
    "*.layout.htm",
    "*.part.htm",
    "*.map"
  ]
}
```

## Configuration Values

_This section is incomplete._

- **source** _(default: "src")_ String. Root source folder containing 
templates and static files.
- **data** _(default: {})_ Ojbect. Global data merged into the Nunjucks render 
context.

### Template Configuration

- **extension** _(default: ".html")_ String. File extension to output.
- **extensions** _(default: {})_ Object. Global extensions added to the 
Nunjucks environment. See 
[Custom Tags](http://mozilla.github.io/nunjucks/api.html#custom-tags).
- **filters** _(default: {})_ Object. Global filter functions added to the 
Nunjucks environment. See 
[Custom Filters](http://mozilla.github.io/nunjucks/api.html#custom-filters).
- **functions** _(default: {})_ Object. Global functions merged into the 
Nunjucks render context.
- **globals** _(default: undefined)_ Object. A single object which provides 
`data`, `extensions`, `filters` and `functions` objects instead of setting 
each of these options separately. The separate global options are merged into 
this base object.
- **locals** _(default: undefined)_ Boolean or String. When `true`, enables
loading of local template context data and functions from files that match
the following default pattern: `"<filename>.+(js|json)"`. When a glob pattern
string is given, the directory containing a given template will be searched
using the pattern. Data and functions from all matched files are merged into
the render context. Note that the token `<filename>` will be replaced with a
given template's file name including extension. Use the `<filename_noext>` 
token instead in a custom pattern to target the file name without extension.

## Command Line Interface

```
staticdev: A static website development server.

Syntax:

    staticdev [options | path]

Options:

    --help      -h    Prints this help message.
    --init-default    Writes the default config file to the given path
    --no-restart      Disables the built-in nodemon server restart.
    --restart-delay   Number of seconds to delay nodemon restart when global 
                      script and data files change.
    --verbose   -V    Prints verbose messages.
    --version   -v    Prints version information.

      path            Path to a staticbuild.json file or directory to find one.
                      If no path is supplied, the current directory is used.
```
