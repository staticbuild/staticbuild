# staticbuild

Tools for creating static sites with Jade, Less, Nunjucks and Gulp.

## Alpha

_This project is under development and this readme is most likely out of date._

- [Getting Started](#getting-started)
- [Demos](#demos)
- [Project Directory](#project-directory)
- [Configuration](#configuration)
- [Command Line Interface](#command-line-interface)
  - [Help](#help)
  - [Development Server](#development-server)
  - [Setup](#setup)
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

- [Jade](https://github.com/devoptix/staticbuild-demo-jade)
- [Nunjucks](https://github.com/devoptix/staticbuild-demo-nunjucks)

### Jade + Nunjucks

Although it is possible to use Jade *and* Nunjucks simultaneously in the same 
project at the time of this writing, a demo hasn't been created yet.

This could be useful if you plan to use one templating engine for HTML and 
another for some other type of text output. Jade is a good engine for HTML,
but nunjucks can be used to output any type of text. For instance, markdown 
files could be generated with nunjucks.

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
staticbuild v0.7.0 - Tools for creating static sites with Jade, Less, Nunjucks and Gulp.

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
staticbuild v0.7.0 - Development server.

    Runs a local http server to dynamically render static content during development.

Usage:
  staticbuild dev [options] <path>

Required:
  path           Path to a staticbuild.json file or directory to find one.
                 If no path is supplied, the current directory is used.

Options:
  -b, --bundling Enable bundling. [default: false]
  -r, --restart  Number of seconds to delay nodemon restarts.  [default: 1]
  --no-restart   Disables the built-in nodemon server restart.
  -h, --help     Show help.  [boolean]
  -V, --verbose  Enables verbose output.  [count]
```

### Setup

At the time of this writing, this command simply creates a default 
`staticbuild.json` file.

```
staticbuild v0.7.0 - Setup.

    Interactive setup to create a new project.

Usage:
  staticbuild setup [options] <path>

Required:
  path           Path for a new staticbuild.json file or project directory.

Options:
  -h, --help     Show help.  [boolean]
  -V, --verbose  Enables verbose output.  [count]
```

## Roadmap

- Change demos to do bundling in their gulpfile.js using staticbuild bundles.
- Create automated tests.
- Create API documentation.
- Create Configuration documentation.
- Create interactive setup.
  - Change [Getting Started](#getting-started) section to recommend a global 
install and then the setup command. The setup command should also install 
staticbuild locally, similar to the way gulp works.
