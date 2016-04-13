[![Staticbuild Logo](http://staticbuild.github.io/lib/img/graffiti-logo-225x42.png)](http://staticbuild.github.io/) **(beta)**

A static website generator and development server for 
[Pug (aka Jade)](https://github.com/pugjs/pug) 
and/or 
[Nunjucks](https://github.com/mozilla/nunjucks) 
templates.
Useable with Gulp, Grunt or other build automation.

## Features

* **Development Server** - *No need to maintain one in your Gulp/Grunt file.*
* **Path Management** - *Automatically maps and translates paths between source, 
destination, development and runtime.*
* **Bundling, Minification &amp; Source Maps** - *Simple JSON configuration 
for bundling, minifying and source mapping Less, CSS and JavaScript files.*
* **Cache Busting with Version Hashes** - *Allows you to generate files at 
runtime named with a hashed version number from your package.*
* **Internationalization (i18n)** - *i18n methods are available to all views 
rendered by the development server and the generator.*
* **View Engines** - *Generate your site from Pug/Jade or Nunjucks templates.
(More view engines could be added in the future.)*
* **View Contexts** - *Use the automatic global view context which provides
access to build info, staticbuild methods and i18n or configure your own js 
file to expand upon the built-in view context.*

## README Contents

- [Getting Started](#getting-started)
- [Demos](#demos)
- [Project Directory](#project-directory)
- [Configuration](#configuration)
- [Command Line Interface](#command-line-interface)
  - [Help](#help)
  - [Development Server](#development-server)
  - [Setup](#setup)
- [API Documentation](#api-documentation)
- [Why Pug (Jade) and Nunjucks?](#why-pug-jade-and-nunjucks)
- [Roadmap](#roadmap)

## Getting Started

Install

`npm install --save-dev staticbuild`

Run

In the `package.json` file for your project, add one of the following and then
run it with `npm run dev`. Look at the `demo` projects for more details.

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

## Demos

Look in the demo code to see a typical setup.

- [Jade](https://github.com/devoptix/staticbuild-demo-jade)
- [Nunjucks](https://github.com/devoptix/staticbuild-demo-nunjucks)

The following open source sites are also using StaticBuild:

- [The StaticBuild Website](https://github.com/staticbuild/staticbuild-website)
- [GelDesk](http://www.geldesk.org)

## Project Directory

_See `demo/jade` for an example. Run `npm install` in the demo and then 
`npm run dev`._

The project directory should contain a `staticbuild.json` configuration file 
or be organized according to the default configuration. A project directory
organized according to the default-staticbuild.json configuration looks like 
this:

```
  /path/to/project
	- locales/...
    - src/...
	- [staticbuild.json]
```

The `src/` directory is the root of the site which can contain static 
`.html`, `.js` and `.css` files as well as `.jade`, `.less` and/or nunjucks 
(`.htm`) files.

The `locales/` directory is used by 
[i18n-node](https://github.com/mashpie/i18n-node) 
to store json files which are created automatically during development when
using the `staticbuild.translate` or `translateNumeric` function.

## Configuration

Configuration is primarly read from a JSON file, named `staticbuild.json` by 
default.

Look at the `demo` projects and the main `index.js` for more information.

## Command Line Interface

The default command right now is to just run the development server.
That may change in the future and more commands will be added to generate
files like a gulp or grunt file.

### Help
```
staticbuild v0.12.4 - A static website generator and development server.

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
staticbuild v0.12.4 - Development server.

    Runs a local http server to dynamically render static content during development.

Usage:
  staticbuild dev [options] <path>

Required:
  path           Path to a staticbuild.json file or directory to find one.
                 If no path is supplied, the current directory is used.

Options:
  -v, --version       Show version number.  [boolean]
  -h, --help, --help  Show help.  [boolean]
  -b, --bundling      Enable bundling.  [boolean] [default: false]
  -r, --restart       Number of seconds to delay nodemon restarts.  [number] [default: 1]
  --no-restart        Disables the built-in nodemon server restart.
  -V, --verbose       Enables verbose output.  [count]
```

### Setup

At the time of this writing, this command simply creates a default 
`staticbuild.json` file.

```
staticbuild v0.12.4 - Setup.

    Interactive setup to create a new project.

Usage:
  staticbuild setup [options] <path>

Required:
  path           Path for a new staticbuild.json file or project directory.

Options:
  -v, --version       Show version number.  [boolean]
  -h, --help, --help  Show help.  [boolean]
  -V, --verbose       Enables verbose output.  [count]
```

## API Documentation

See [http://staticbuild.github.io/api/](http://staticbuild.github.io/api/)

## Why Pug (Jade) and Nunjucks?

Any view engine can be plugged into staticbuild eventually. Pug (previously 
known as Jade) was initially used since it is the authors preference for 
emitting HTML.

Nunjucks was chosen as the first alternate to Jade since it can use templates 
to emit any type of text-based file format, not just HTML. This can be very
useful for generating other types of fixtures for your static website such as
markdown files, JSON, XML and so on.

## Roadmap

- Create automated tests with tape.
- Create interactive setup.
  - Change [Getting Started](#getting-started) section to recommend a global 
install and then the setup command. The setup command should also install 
staticbuild locally, similar to the way gulp works.
- Make some nicer demos.
- Create Configuration documentation.
- Improve API documentation.
- Replace less-middleware dependency with code to let the end-developer choose
less or sass.
  - Add a sass demo.
- Improve the dev server code altogether to make it more plugabble.
  - Allow for per-view contexts that expand upon the global view context.
- Create a separate dev UI server command as an alternative to CLI commands.
