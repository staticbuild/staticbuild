# staticbuild

Tools for creating static sites with Jade, Less, Nunjucks and Gulp.

## Alpha

_This project is under development and this readme is most likely out of date._

- [Getting Started](#getting-started)
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
