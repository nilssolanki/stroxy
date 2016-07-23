const rollup = require('rollup').rollup;
const config = require('./config/rollup');

function runRollup(rollupConfig, name) {
	rollup(rollupConfig.setup).then((bundle) => {
		return bundle.write(rollupConfig.output);
	}).then(() => {
		console.log(`Bundle ${ name } created!`);
	},(e) => {
		console.log(e);
	});
}

(function run() {
	Object.keys(config).forEach((key) => {
		runRollup(config[key], key);
	});
})();