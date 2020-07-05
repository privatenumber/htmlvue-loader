const htmlvueLoader = require.resolve('..');

const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const fs = require('fs');
const {ufs} = require('unionfs');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const Vue = require('vue');

function build(input, options = {}) {
	return new Promise((resolve, reject) => {
		const mfs = new MemoryFS();

		if (typeof input === 'function') {
			input(mfs);
		} else {
			mfs.writeFileSync('/entry.html', input);
		}

		const compiler = webpack({
			mode: 'development',
			resolveLoader: {
				alias: {
					'htmlvue-loader': htmlvueLoader,
				},
			},
			module: {
				rules: [
					{
						test: /\.vue$/,
						use: 'vue-loader',
					},
					{
						test: /\.html$/,
						use: [
							'vue-loader',
							{
								loader: 'htmlvue-loader',
								options,
							},
						],
					},
				],
			},
			plugins: [
				new VueLoaderPlugin(),
			],
			entry: '/entry.html',
			devtool: 'none',
			output: {
				path: '/',
				filename: 'test.build.js',
			},
		});

		compiler.inputFileSystem = ufs.use(fs).use(mfs);
		compiler.outputFileSystem = mfs;

		compiler.run((err, stats) => {
			if (err) {
				reject(err);
				return;
			}

			if (stats.compilation.errors.length > 0) {
				reject(stats.compilation.errors);
				return;
			}

			resolve(mfs.readFileSync('/test.build.js').toString());
		});
	});
}

function run(src) {
	const {default: Component} = eval(src); // eslint-disable-line no-eval
	const vm = new Vue(Component);
	vm.$mount();
	return vm;
}

module.exports = {
	build,
	run,
};
