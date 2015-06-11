
var filters = exports.filters = {};
var functions = exports.functions = {};

function ellipsis(str, to) {
  var s = '';
  if (str === null || str === undefined)
    return str;
  s += str;
  if (s.length < to)
    return s;
  return s.substring(0, to) + '...';
}
filters.ellipsis = ellipsis;

function or(str, defaultValue) {
  return str || defaultValue;
}
filters.or = or;

function sayHi() {
  return 'Hi';
}
functions.sayHi = sayHi;

function docwrite(js) {
  return '<script type="text/javascript">document.write(' + 
    js + 
  ');</script>';
}
functions.docwrite = docwrite;
