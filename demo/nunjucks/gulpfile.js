'use strict';

// #region Imports
var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var gzip = require('gulp-gzip');
var htmlmin = require('gulp-htmlmin');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var lodash = require('lodash');
var cleanCss = require('gulp-clean-css');
var nunjucksApi = require('gulp-nunjucks-api');
var order = require('gulp-order');
var path = require('path');
var rename = require('gulp-rename');
var rev = require('gulp-rev');
var runSequence = require('run-sequence').use(gulp);
var s3 = require('gulp-s3');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var StaticBuild = require('staticbuild');
var uglify = require('gulp-uglify');
// #endregion

/** Main task names, in execution order. [clean, images, css, js, ..., html] */                                        
var mainTaskSeries = [];

/** See https://github.com/devoptix/staticbuild */
var build = new StaticBuild('./staticbuild.json');

/** See https://github.com/jstuckey/gulp-gzip#options */
var gzipOpt = { append: false, threshold: false };

/** 
 * True if files should be gzipped. (Current Default: true)
 * Disabled via cli flag `gulp [task] --no-gzip`.
 * Enable via cli flag `gulp [task] --gzip`.
 */
 var gzipOn = gutil.env.gzip === undefined || gutil.env.gzip === true;
// Example for defaulting to `false`:
//var gzipOn = gutil.env.gzip === true;

/** Sets a default or specific locale via cli flag `gulp [task] --locale=en` */
build.trySetLocale(gutil.env.locale, function (err) {
  if (!err)
    return;
  gutil.log(err);
  process.exit(1001);
});

/** Pushes the task name to mainTaskSeries and returns the name. */
function mts(name) {
  mainTaskSeries.push(name);
  return name;
}

gulp.task(mts('clean'), function (done) {
  del.sync([
    build.destLocale('/**/*')
  ]);
  done();
});

gulp.task('clean-all', function () {
  del.sync([
    build.dest('/**/*')
  ]);
});

gulp.task(mts('fonts'), function () {
  return gulp.src([
    'bower_components/bootstrap/dist/fonts/**/*'
  ])
  .pipe(gulpif(gzipOn, gzip(gzipOpt)))
  .pipe(gulp.dest(build.destLocale('/lib/fonts/')));
});

gulp.task(mts('images'), function () {
  return gulp.src([
    build.src('/**/*.gif'),
    build.src('/**/*.ico'),
    build.src('/**/*.jpg'),
    build.src('/**/*.png')
  ])
  .pipe(gulpif(gzipOn, gzip(gzipOpt)))
  .pipe(gulp.dest(build.destLocale()));
});

gulp.task(mts('less'), function () {
  return gulp.src([
    build.src('/**/*.less'),
    build.src('!/**/*.part.less')
  ], { base: './' })
  .pipe(sourcemaps.init())
  .pipe(less()).on('error', gutil.log)
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('.'));
});

gulp.task(mts('sass'), function () {
  return gulp.src([
    build.src('/**/*.sass'),
    build.src('/**/*.scss'),
    build.src('!/**/*.part.sass'),
    build.src('!/**/*.part.scss')
  ], { base: './' })
  .pipe(sourcemaps.init())
  .pipe(sass()).on('error', gutil.log)
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('.'));
});

lodash.forEach(build.bundle, function (bundle, name) {
  gulp.task(mts('css-bundle-' + name), function () {
    var bi = build.getBundleInfo(name, 'css');
    return gulp.src(bi.sources)
    .pipe(gulpif(bi.minIf, cleanCss({ keepBreaks: false })))
    .pipe(order(bi.sources, { base: process.cwd() }))
    .pipe(concat({ path: bi.fileName, cwd: '' }))
    .pipe(rev())
    .pipe(build.bundledCssInStream(name, gutil))
    .pipe(gulpif(gzipOn, gzip(gzipOpt)))
    .pipe(gulp.dest(build.destLocale(bi.relDir)));
  });
});

gulp.task(mts('js'), function () {
  return gulp.src([
    build.src('/**/*.js')
  ])
  .pipe(jshint({ globalstrict: true }))
  .pipe(jshint.reporter('jshint-stylish'));
});

lodash.forEach(build.bundle, function (bundle, name) {
  gulp.task(mts('js-bundle-' + name), function () {
    var bi = build.getBundleInfo(name, 'js');
    return gulp.src(bi.sources)
    //.pipe(uglify()))
    .pipe(gulpif(bi.minIf, uglify()))
    .pipe(order(bi.sources, { base: process.cwd() }))
    .pipe(concat({ path: bi.fileName, cwd: '' }))
    .pipe(rev())
    .pipe(build.bundledJsInStream(name, gutil))
    .pipe(gulpif(gzipOn, gzip(gzipOpt)))
    .pipe(gulp.dest(build.destLocale(bi.relDir)));
  });
});

gulp.task(mts('html'), function () {
  // Nunjucks
  // 
  // See https://github.com/devoptix/gulp-nunjucks-api#gulp-nunjucks-apioptions
  var optRenderView = {
    src: build.src(),
    autoescape: true,
    data: build.context,
    filters: build.engine.nunjucks.filters,
    functions: build.engine.nunjucks.functions,
    locals: false,
    verbose: false
  };
  // Html-minifier
  // 
  // See https://github.com/kangax/html-minifier#options-quick-reference
  var optHtmlMin = {
    collapseWhitespace: true,
    keepClosingSlash: true
  };
  return gulp.src([
    build.src('/**/*.htm'), 
    build.src('!/**/*.layout.htm'),
    build.src('!/**/*.part.htm')
  ])
  .pipe(nunjucksApi(optRenderView))
  .pipe(htmlmin(optHtmlMin))
  .pipe(gulpif(gzipOn, gzip(gzipOpt)))
  .pipe(gulp.dest(build.destLocale()));
});

gulp.task('s3', function () {
  var aws = require('./aws.json');
  var opt = {
    headers: {
      'Cache-Control': 'no-transform,public,max-age=300,s-maxage=900',
      'Content-Encoding': 'gzip'
    }
  };
  // We should always be uploading gzipped contents...
  //if (!gzipOn)
  //  delete opt['Content-Encoding'];
  gulp.src(build.destLocale('/**'))
  .pipe(s3(aws, opt));
});

gulp.task('default', function (callback) {
  // Tasks executed by run-sequence must either return a stream or use a 
  // callback as noted in https://github.com/OverZealous/run-sequence#usage
  var args = [].concat(mainTaskSeries, callback);
  runSequence.apply(exports, args);
});
