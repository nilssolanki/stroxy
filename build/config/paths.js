const path = require('path');

const paths = {};
paths.base = path.resolve(__dirname, '../..');

paths.src = path.resolve(paths.base, 'src');
paths.dist = paths.base;
paths.includePaths = {
	include: {},
	paths: [
		paths.src,
	],
	extensions: [
		'.js'
	],
	external: [],
};

module.exports = paths;