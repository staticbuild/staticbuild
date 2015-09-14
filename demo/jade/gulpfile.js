﻿'use strict';

// #region Imports
var concat = require('gulp-concat');
var del = require('del');
var gjade = require('gulp-jade');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var gzip = require('gulp-gzip');
var htmlmin = require('gulp-htmlmin');
var jade = require('jade');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var lodash = require('lodash');
var minifyCss = require('gulp-minify-css');
var path = require('path');
var rename = require('gulp-rename');
var s3 = require('gulp-s3');
var StaticBuild = require('staticbuild');
var uglify = require('gulp-uglify');
// #endregion

var build = new StaticBuild('./staticbuild.json');

// Pass a specific locale with `gulp [task] --locale=en`
build.trySetLocale(gutil.env.locale, function (err) {
  if (!err)
    return;
  gutil.log(err);
  process.exit(1001);
});

// See https://github.com/jstuckey/gulp-gzip#options
var gzipOpt = {
  append: false,
  threshold: false
};

// To disable gzip, run `gulp [task] --no-gzip`.
var gzipOn = gutil.env.gzip === undefined || gutil.env.gzip === 'true';

var mainTasks = [
  'clean',
  'images',
  'css',
  'javascript',
  'html'
];

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
  .pipe(rename(build.gulp.renameFile))
  .pipe(gulpif(gzipOn, gzip(gzipOpt)))
  .pipe(gulp.dest(build.destLocale()));
});

gulp.task('html', function () {
  // Jade
  //
  // See https://github.com/phated/gulp-jade#usage
  var optRenderView = {
    jade: jade,
    locals: build.context
  };
  // Html-minifier
  // 
  // See https://github.com/kangax/html-minifier#options-quick-reference
  var optHtmlMin = {
    collapseWhitespace: true,
    keepClosingSlash: true
  };
  gulp.src([
    build.src('/**/*.jade'), 
    build.src('!/**/*.layout.jade'),
    build.src('!/**/*.part.jade')
  ])
  .pipe(gjade(optRenderView))
  .pipe(htmlmin(optHtmlMin))
  .pipe(gulpif(gzipOn, gzip(gzipOpt)))
  .pipe(gulp.dest(build.destLocale()));
});

gulp.task('images', function () {
  gulp.src([
    build.src('/**/*.gif'),
    build.src('/**/*.ico'),
    build.src('/**/*.jpg'),
    build.src('/**/*.png')
  ])
  .pipe(gulpif(gzipOn, gzip(gzipOpt)))
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
  .pipe(rename(build.gulp.renameFile))
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
