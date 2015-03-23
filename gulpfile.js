var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var collapser = require('bundle-collapser/plugin');
var derequire = require('gulp-derequire');
var envify = require('envify/custom');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');

var pkg = require('./package.json');

function versionHeader() {
  return (
    '/*\n' +
    ' *  Parse + React\n' +
    ' *  v' + pkg.version + '\n' +
    ' */\n'
  );
}

function fullHeader() {
  return (
    '/*\n' +
    ' *  Parse + React\n' +
    ' *  v' + pkg.version + '\n' +
    ' *\n' +
    ' *  Copyright (c) 2015, Parse, LLC. All rights reserved.\n' +
    ' *\n' +
    ' *  You are hereby granted a non-exclusive, worldwide, royalty-free license to\n' +
    ' *  use, copy, modify, and distribute this software in source code or binary\n' +
    ' *  form for use in connection with the web services and APIs provided by Parse.\n' +
    ' *\n' +
    ' *  As with any software that integrates with the Parse platform, your use of\n' +
    ' *  this software is subject to the Parse Terms of Service\n' +
    ' *  [https://www.parse.com/about/terms]. This copyright notice shall be\n' +
    ' *  included in all copies or substantial portions of the software.\n' +
    ' *\n' +
    ' *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
    ' *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
    ' *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
    ' *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
    ' *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\n' +
    ' *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS\n' +
    ' *  IN THE SOFTWARE.\n' +
    ' *\n' +
    ' */\n'
  );
}

gulp.task('build', function() {
  var stream = browserify({
    entries: './src/ParseReact.js',
    standalone: 'ParseReact'
  })
  .transform(envify({NODE_ENV: 'development'}))
  .bundle();
  return stream.pipe(source('parse-react.js'))
    .pipe(derequire())
    .pipe(insert.prepend(versionHeader()))
    .pipe(gulp.dest('./dist'));
});

gulp.task('min', function() {
  var stream = browserify({
    entries: './src/ParseReact.js',
    standalone: 'ParseReact',
    builtins: {},
    plugins: [collapser],
    debug: false
  })
  .transform(envify({NODE_ENV: 'production'}))
  .bundle();
  return stream.pipe(source('parse-react.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(insert.prepend(fullHeader()))
    .pipe(gulp.dest('./dist'));
});
