﻿'use strict';

// #region Imports
var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');
var gzip = require('gulp-gzip');
var htmlmin = require('gulp-htmlmin');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var lodash = require('lodash');
var minifyCss = require('gulp-minify-css');
var nunjucksApi = require('gulp-nunjucks-api');
var path = require('path');
var rename = require('gulp-rename');
var s3 = require('gulp-s3');
var StaticBuild = require('staticbuild');
var uglify = require('gulp-uglify');
// #endregion

var build = new StaticBuild('./staticbuild.json');

// See https://github.com/jstuckey/gulp-gzip#options
var gzipOpt = {
  append: false,
  threshold: false
};

var mainTasks = [
  'clean',
  'images',
  'css',
  'javascript',
  'html'
];

build.trySetLocale(gutil.env.locale, function (err) {
  if (!err)
    return;
  gutil.log(err);
  process.exit(1001);
});

gulp.task('default', mainTasks);

gulp.task('clean', function () {
  del.sync([
    build.destLocale('/**/*')
  ]);
});

gulp.task('clean-all', function () {
  del.sync([
    build.dest('/**/*')
  ]);
});

gulp.task('css', function () {
  gulp.src([
    build.src('/**/site.less')
  ])
  .pipe(less({ compress: true })).on('error', gutil.log)
  .pipe(minifyCss({ keepBreaks: false }))
  .pipe(rename(build.appendEncPkgVerVinyl))
  //.pipe(gzip(gzipOpt))
  .pipe(gulp.dest(build.destLocale()));
});

gulp.task('html', function () {
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
  gulp.src([
    build.src('/**/*.htm'), 
    build.src('!/**/*.layout.htm'),
    build.src('!/**/*.part.htm')
  ])
  .pipe(nunjucksApi(optRenderView))
  .pipe(htmlmin(optHtmlMin))
  //.pipe(gzip(gzipOpt))
  .pipe(gulp.dest(build.destLocale()));
});

gulp.task('images', function () {
  gulp.src([
    build.src('/**/*.gif'),
    build.src('/**/*.ico'),
    build.src('/**/*.jpg'),
    build.src('/**/*.png')
  ])
  //.pipe(gzip(gzipOpt))
  .pipe(gulp.dest(build.destLocale()));
});

gulp.task('javascript', function () {
  gulp.src([
    build.src('/**/*.js'),
    build.src('!/**/*.htm.js')
  ])
  .pipe(jshint({ globalstrict: true }))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(uglify())
  .pipe(rename(build.appendEncPkgVerVinyl))
  //.pipe(gzip(gzipOpt))
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
  gulp.src(build.destLocale('/**'))
  .pipe(s3(aws, opt));
});
