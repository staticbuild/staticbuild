'use strict';

var config = require('./config.js');
var i18n = require('i18n');

var currentLocale = config.locale;

i18n.configure({
  extension: '.json',
  indent: '  ',
  locales: config.locales,
  defaultLocale: config.defaultLocale,
  directory: config.localesdir,
  objectNotation: true,
  prefix: '',
  updateFiles: true
});

i18n.setLocale(currentLocale);

function translate(str, etc) {
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged();
  return i18n.__.apply(i18n, args);
}
exports.translate = translate;

function translateNumeric(singular, plural, value) {
  var args = Array.prototype.slice.call(arguments);
  updateLocaleIfChanged();
  return i18n.__n.apply(i18n, args);
}
exports.translateNumeric = translateNumeric;

function updateLocaleIfChanged() {
  if (config.locale === currentLocale)
    return;
  currentLocale = config.locale;
  i18n.setLocale(currentLocale);
}
