const outdent = require('outdent');
const {build, run} = require('./utils');

describe('Fail cases', () => {
	test('Empty', async () => {
		const built = await build(' ');
		const {$el} = run(built);
		expect($el.outerHTML).toBe('<div></div>');
	});

	test('Empty - v-pre', async () => {
		const built = await build(' ', {vPre: true});
		const {$el} = run(built);
		expect($el.outerHTML).toBe('<div></div>');
	});

	test('Empty - v-once', async () => {
		const built = await build(' ', {vOnce: true});
		const {$el} = run(built);
		expect($el.outerHTML).toBe('<div></div>');
	});
});

describe('Basic', () => {
	test('Build basic markup', async () => {
		const built = await build(outdent`
			<div>Hello world</div>
		`);

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('div');
		expect(vnode.children[0].text).toBe('Hello world');
	});

	test('Multi root node markup', async () => {
		const built = await build(outdent`
			<div>Block 1</div>
			<div>Block 2</div>
		`);

		const {_vnode: vnode} = run(built);

		expect(vnode.tag).toBe('div');

		const [block1, , block2] = vnode.children;

		expect(block1.tag).toBe('div');
		expect(block1.children[0].text).toBe('Block 1');
		expect(block2.tag).toBe('div');
		expect(block2.children[0].text).toBe('Block 2');
	});

	test('SVG', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`);

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('svg');
		expect(vnode.data.pre).toBe(undefined);
		expect(vnode.isStatic).toBe(false);
	});
});

describe('v-pre / v-once', () => {
	test('Multi root node markup, v-pre', async () => {
		const built = await build(outdent`
			<div>Block 1</div>
			<div>Block 2</div>
		`, {vPre: true});

		const {_vnode: vnode} = run(built);

		expect(vnode.tag).toBe('div');

		const [block1, , block2] = vnode.children;

		expect(block1.tag).toBe('div');
		expect(block1.children[0].text).toBe('Block 1');
		expect(block2.tag).toBe('div');
		expect(block2.children[0].text).toBe('Block 2');
	});

	test('SVG v-pre', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`, {vPre: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('svg');
		expect(vnode.data.pre).toBe(true);
	});

	test('SVG v-once', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`, {vOnce: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('svg');
		expect(vnode.isStatic).toBe(true);
	});

	test('SVG v-pre & v-once', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`, {vPre: true, vOnce: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('svg');
		expect(vnode.data.pre).toBe(true);
		expect(vnode.isStatic).toBe(false);
	});
});

describe('Transformer', () => {
	test('Transformer', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`, {
			transform: svg => `<div>${svg}</div>`,
		});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('div');
	});

	test('Transformer with component registration', async () => {
		const built = await build(mfs => {
			mfs.writeFileSync('/entry.html', '<svg xmlns="http://www.w3.org/2000/svg"/>');
			mfs.writeFileSync('/rand-comp.vue', '<template><div><slot /></div></template>');
		}, {
			transform: {
				transformer: svg => `<rand-comp>${svg}</rand-comp>`,
				components: {
					RandComp: './rand-comp.vue',
				},
			},
		});

		const {_vnode: vnode} = run(built);
		expect(vnode.componentOptions.tag).toBe('rand-comp');
	});
});

describe('Real SVGs', () => {
	test('SVG', async () => {
		const src = '<svg id="some-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1.872" height="20.587" rx=".936" transform="scale(.99243 1.00751) rotate(45 4.622 24.714)" fill="red"></rect><rect width="1.872" height="20.587" rx=".936" transform="matrix(-.70176 .71242 .70176 .71242 5.313 4)"></rect></svg>';
		const built = await build(src, {vPre: true});

		const {$el} = run(built);
		expect($el.outerHTML).toBe(src);
	});

	test('Symbol', async () => {
		const src = `
			<symbol id="food-icon" viewBox="0 0 40 40" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path d="M14.293 21.85L1.758 34.132c-1.01.99-1.01 2.972 0 3.962 1.011.99 3.033.99 4.044 0l12.737-14.859m4.145-4.953c1.214-1.283 2.528-2.675 2.528-2.675 1.718 1.684 4.288 1.392 6.47-.693 2.18-2.086 5.812-6.747 6.065-7.33.253-.585.71-1.385 0-2.081a1.487 1.487 0 0 0-2.123 0m0 0c-.1.099-.1.099 0 0zm0 0c.607-.595.607-1.486 0-2.08a1.487 1.487 0 0 0-2.123 0m2.123 2.08s-3.942 3.92-6.124 6.124m4.001-8.204c-.1.099-.1.099 0 0zm0 0c.607-.595.607-1.486 0-2.08-.606-.595-1.367-.47-2.123 0-.755.468-7.48 5.943-7.48 5.943-1.82 1.486-2.427 4.656-.708 6.34 0 0-1.61 1.34-2.83 2.476M33.5 3.423s-1.001 1.077-6 6.001M3.78 1.442S37 32 38.15 33.142c1.152 1.142.81 4.061 0 4.953-.909.892-3.74 1.486-5.054 0L22.987 24.227c-.808-.991-3.74-.991-5.054-.991-1.416 0-3.235-.892-4.044-1.981L4.791 10.358C2.97 7.98 2.162 4.018 3.78 1.442z" stroke="var(--icon-fill)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></g><defs><clipPath id="clip0"><path fill="var(--background-fill)" d="M0 0h40v40H0z"></path></clipPath></defs></svg></symbol>
		`.trim();
		const built = await build(src, {vPre: true});

		const {$el} = run(built);
		expect($el.outerHTML).toBe(src);
	});
});
