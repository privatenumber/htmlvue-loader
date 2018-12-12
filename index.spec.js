const htmlvueLoader = require.resolve('.');

const outdent = require('outdent');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const fs = require('fs');
const { ufs } = require('unionfs');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const Vue = require('vue');


function build(input, options = {}) {
	return new Promise((resolve, reject) => {
		const mfs = new MemoryFS();

		mfs.writeFileSync('/entry.html', input);

		const compiler = webpack({
			mode: 'development',
			resolveLoader: {
				alias: {
					'htmlvue-loader': htmlvueLoader
				},
			},
			module: {
				rules: [
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
			output: {
				path: '/',
				filename: 'test.build.js',
			},
		});

		compiler.inputFileSystem = ufs.use(fs).use(mfs);
		compiler.outputFileSystem = mfs;

		compiler.run(function (err, stats) {
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
	const { default: Component } = eval(src);
	const vm = new Vue(Component);
	vm.$mount();
	return vm._vnode;
}

test('Build basic markup', async () => {
	const built = await build(outdent`
		<div>Hello world</div>
	`);

	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].text).toBe('Hello world');
});

test('Multi-node markup', async () => {
	const built = await build(outdent`
		<div>Block 1</div>
		<div>Block 2</div>
	`);

	const vnode = run(built);

	expect(vnode.tag).toBe('div');

	const [block1, text, block2] = vnode.children;

	expect(block1.tag).toBe('div');
	expect(block1.children[0].text).toBe('Block 1');
	expect(block2.tag).toBe('div');
	expect(block2.children[0].text).toBe('Block 2');
});

test('SVG', async () => {
	const built = await build(outdent`
		<svg xmlns="http://www.w3.org/2000/svg"/>
	`);

	const vnode = run(built);
	expect(vnode.tag).toBe('svg');
	expect(vnode.data.pre).toBe(undefined);
	expect(vnode.isStatic).toBe(false);
});


test('SVG v-pre', async () => {
	const built = await build(outdent`
		<svg xmlns="http://www.w3.org/2000/svg"/>
	`, { vPre: true });

	const vnode = run(built);
	expect(vnode.tag).toBe('svg');
	expect(vnode.data.pre).toBe(true);
});

test('SVG v-once', async () => {
	const built = await build(outdent`
		<svg xmlns="http://www.w3.org/2000/svg"/>
	`, { vOnce: true });

	const vnode = run(built);
	expect(vnode.tag).toBe('svg');
	expect(vnode.isStatic).toBe(true);
});

test('SVG v-pre & v-once', async () => {
	const built = await build(outdent`
		<svg xmlns="http://www.w3.org/2000/svg"/>
	`, { vPre: true, vOnce: true });

	const vnode = run(built);
	expect(vnode.tag).toBe('svg');
	expect(vnode.data.pre).toBe(true);
	expect(vnode.isStatic).toBe(false);
});
