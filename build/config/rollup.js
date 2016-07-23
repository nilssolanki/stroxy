const rollup = require('rollup').rollup;

const uglify = require('rollup-plugin-uglify');
const eslint = require('rollup-plugin-eslint');
const includePaths = require('rollup-plugin-includepaths');

const minify = require('babel-minify');

const paths = require('./paths');

module.exports = {
  // dist
  dist: {
    setup: {
      entry: `${ paths.src }/index.js`,
      plugins: [
        includePaths(paths.includePaths),
        // eslint({}),
      ],
    },
    output: {
      dest: `${ paths.dist }/index.js`,
      format: 'iife',
      moduleName: 'stroxy',
      sourceMap: true,
    },
  },
  // min
  min: {
    setup: {
      entry: `${ paths.src }/index.js`,
      plugins: [
        includePaths(paths.includePaths),
        // eslint({}),
        uglify({}, minify),
      ],
    },
    output: {
      dest: `${ paths.dist }/index.min.js`,
      format: 'iife',
      moduleName: 'stroxy',
    },
  },
};