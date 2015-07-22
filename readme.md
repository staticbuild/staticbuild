# staticbuild

Tools for creating static sites with Jade, Less, Nunjucks and Gulp.

## Alpha

_This project is under development and this readme is most likely out of date._

- [Roadmap](#roadmap)
- [Getting Started](#getting-started)
- [Project Directory](#project-directory)
- [Configuration](#configuration)
  - [Default Configuration](#default-configuration)
  - [Files](#files)
  - [Template](#template)
- [Command Line Interface](#command-line-interface)
  - [Help](#help)
  - [Development Server](#development-server)
  - [Setup](#setup)


## Roadmap

- Add config settings to disable or change the default view engines.
- Only init Jade and Nunjucks if they're enabled and/or installed.
- Consider moving jade and nunjucks into npm devDependencies in this project, 
forcing the end-developer to install jade and/or nunjucks in their own project.
- Support other view engines like consolidate.js does, but with the ability to 
configure them from the staticbuild.json file.
- Create API documentation.
- Update staticbuild.json documentation.
- Create interactive setup.
  - Change [Getting Started](#getting-started) section to recommend a global 
install and then the setup command. The setup command should also install 
staticbuild locally, similar to the way gulp works.

## Getting Started

Install

`npm install --save-dev staticbuild`

Run

In the `package.json` file for your project, add one of the following and then
run it with `npm run dev`.

```json
"scripts": {
  "dev": "staticbuild dev ."
}
```

or

```json
"scripts": {
  "dev": "staticbuild dev path/to/staticbuild.json"
}
```

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

The `src/` sub-directory is the root of the site which can contain static 
`.html`, `.js` and `.css` files as well as `.less` and `.htm` (nunjucks) files.

## Configuration

Configuration is primarly read from a JSON file, named `staticbuild.json` by 
default.

_The following sections may be incomplete. The source holds the truth._

### Default Configuration

The default configured template engine and css preprocessor are the only 
supported options right now.

Here is the default configuration (_at the time of this writing_):

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

### Files

- **source** _(default: "src")_ String. Root source folder containing 
templates and static files.
- **data** _(default: {})_ Ojbect. Global data merged into the Nunjucks render 
context.

### Template

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

The default command right now is to just run the development server.
That may change in the future and more commands will be added to generate
files like a gulp or grunt file.

### Help
```
staticbuild v0.3.0 - Tools for creating static sites with Less, Nunjucks and 
Gulp.

Usage:
  staticbuild [command] [options]

Commands:
  dev    Run the development web server.
  setup  Setup a new project.

Options:
  -v, --version  Show version number.  [boolean]
  -h, --help     Show help.  [boolean]
  -V, --verbose  Enables verbose output.  [count]
```

### Development Server
```
staticbuild v0.3.0 - Development server.

    Runs a local http server to dynamically render static content during 
development.

Usage:
  staticbuild dev [options] <path>

Required:
  path           Path to a staticbuild.json file or directory to find one.
                 If no path is supplied, the current directory is used.

Options:
  -r, --restart  Number of seconds to delay nodemon restarts.  [default: 1]
  --no-restart   Disables the built-in nodemon server restart.
  -h, --help     Show help.  [boolean]
  -V, --verbose  Enables verbose output.  [count]
```

### Setup
```
staticbuild v0.3.0 - Setup.

    Interactive setup to create a new project.

Usage:
  staticbuild setup [options] <path>

Required:
  path           Path for a new staticbuild.json file or project directory.

Options:
  -h, --help     Show help.  [boolean]
  -V, --verbose  Enables verbose output.  [count]
```
