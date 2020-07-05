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
	test('DIV v-pre', async () => {
		const built = await build(outdent`
			<div>Hello world</div>
		`, {vPre: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('div');
		expect(vnode).toEqual(expect.objectContaining({
			isStatic: false,
			isRootInsert: true,
			isComment: false,
			isCloned: false,
			isOnce: false,
		}));
		expect(vnode.data.pre).toBe(true);
	});

	test('DIV v-once', async () => {
		const built = await build(outdent`
			<div>Hello world</div>
		`, {vOnce: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('div');
		expect(vnode).toEqual(expect.objectContaining({
			isStatic: true,
			isRootInsert: true,
			isComment: false,
			isCloned: false,
			isOnce: false,
		}));
	});

	test('SVG v-pre', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`, {vPre: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('svg');
		expect(vnode).toEqual(expect.objectContaining({
			isStatic: false,
			isRootInsert: true,
			isComment: false,
			isCloned: false,
			isOnce: false,
		}));
		expect(vnode.data.pre).toBe(true);
	});

	test('SVG v-once', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`, {vOnce: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('svg');
		expect(vnode).toEqual(expect.objectContaining({
			isStatic: true,
			isRootInsert: true,
			isComment: false,
			isCloned: false,
			isOnce: false,
		}));
	});

	test('SVG v-pre & v-once', async () => {
		const built = await build(outdent`
			<svg xmlns="http://www.w3.org/2000/svg"/>
		`, {vPre: true, vOnce: true});

		const {_vnode: vnode} = run(built);
		expect(vnode.tag).toBe('svg');
		expect(vnode.data.pre).toBe(true);
		expect(vnode).toEqual(expect.objectContaining({
			isStatic: false,
			isRootInsert: true,
			isComment: false,
			isCloned: false,
			isOnce: false,
		}));
	});

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

	test('XML header', async () => {
		const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
		const svg = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://web.resource.org/cc/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="600" height="600" id="svg2" sodipodi:version="0.32" inkscape:version="0.45.1" sodipodi:docname="Example.svg" inkscape:output_extension="org.inkscape.output.svg.inkscape" sodipodi:docbase="/home/gmaxwell" version="1.0"><metadata id="metadata9"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"></dc:type></cc:Work></rdf:RDF></metadata><sodipodi:namedview inkscape:window-height="620" inkscape:window-width="814" inkscape:pageshadow="2" inkscape:pageopacity="0.0" guidetolerance="10.0" gridtolerance="10.0" objecttolerance="10.0" borderopacity="1.0" bordercolor="#666666" pagecolor="#ffffff" id="base" width="600px" height="600px" inkscape:zoom="0.35974058" inkscape:cx="50" inkscape:cy="519.04966" inkscape:window-x="483" inkscape:window-y="101" inkscape:current-layer="svg2"></sodipodi:namedview><defs id="defs16"></defs><g id="g2161" transform="matrix(6.3951354,0,0,6.3951354,-22.626246,-7.1082509)"><path nodetypes="ccccccccccccccccccccccccccccccccccccccc" id="flowRoot1882" d="M 36.009766,9.2505083 C 37.739295,9.4211273 38.305879,11.470697 38.052581,12.935049 C 37.346266,16.153899 36.316821,19.51466 35.445405,22.717701 C 36.091666,24.812224 31.712284,24.008877 33.219932,22.315459 C 34.817041,18.411202 36.011404,13.498336 36.009766,9.2505083 z M 36.009766,2.9926958 C 38.210311,1.2242088 40.996268,9.172757 33.911571,6.1534847 C 33.884619,5.7603019 36.096289,3.3869447 36.009766,2.9926958 z M 41.371094,15.871601 C 41.371094,13.66457 41.371094,11.457539 41.371094,9.250508 C 43.180621,9.4257387 43.963014,11.704559 43.286137,13.215517 C 42.859084,15.059792 42.939241,17.3996 44.601487,18.625335 C 46.710544,19.683477 49.38774,17.353112 48.803268,15.118437 C 48.93196,13.406538 48.236292,11.613848 48.968862,9.9690415 C 51.055097,9.6500357 51.500677,12.487155 50.544985,13.844747 C 50.070023,15.309708 50.857452,16.781898 50.672344,18.239432 C 50.279615,19.94056 48.418404,20.00023 47.0225,20.071868 C 45.478489,20.38194 43.516835,20.791368 42.361947,19.38874 C 41.522514,18.444089 41.211274,17.107671 41.371094,15.871601 z M 61.224609,9.5727739 C 60.41978,11.557552 58.100804,10.235616 56.62767,10.571551 C 53.836862,14.393611 60.920038,13.513667 61.8085,17.011648 C 61.85613,18.933747 60.028359,20.587389 58.129091,20.443312 C 56.904487,20.607229 54.609204,20.982393 54.417879,19.267622 C 55.280609,17.508269 57.336359,19.528803 58.633111,18.8463 C 60.403141,17.99081 59.402232,15.555325 57.728781,15.321475 C 56.550115,14.98135 55.091813,15.225439 54.254747,14.112764 C 53.017669,12.881167 53.392132,10.733148 54.736719,9.7413252 C 56.619172,8.3307396 59.170326,8.9535067 61.224609,9.5727739 z M 66.458984,6.1450396 C 65.368126,7.6333334 67.348936,9.9531574 68.987229,9.0948979 C 69.978133,11.042503 66.524641,10.777931 66.473495,12.430992 C 64.443605,16.101814 68.48273,18.623426 67.571657,20.417528 C 65.440858,20.26155 64.324307,17.844452 64.577433,15.919357 C 64.70847,14.408586 65.055107,12.79361 64.322961,11.373941 C 63.786422,9.5475192 64.150419,7.1452655 65.954233,6.1552477 L 66.206043,6.1203323 L 66.458984,6.1450396 L 66.458984,6.1450396 z "></path><path nodetypes="ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" id="flowRoot1890" d="M 10.867188,44.877953 C 6.2812618,42.124849 5.2205914,52.366268 10.409215,49.892431 C 12.389385,49.295568 14.988045,43.912658 10.867188,44.877953 z M 15.167969,43.987328 C 14.919826,46.33724 16.617756,52.554202 12.298734,50.536918 C 9.8041142,52.312916 6.0580855,52.958674 4.5023123,49.583386 C 2.6350454,45.257322 7.3033103,42.298712 11.046443,43.361059 C 15.247185,41.320786 9.4930286,38.338264 7.1068792,40.322138 C 3.4374421,40.01388 7.406407,37.201407 9.3495087,37.962912 C 12.44212,37.877788 15.556534,40.380131 15.171751,43.648912 L 15.169638,43.83797 L 15.167969,43.987328 z M 30.53125,43.553734 C 29.638794,45.911558 32.49467,50.463872 28.779999,51.070944 C 26.888088,47.702306 30.931621,41.190257 25.58365,40.046147 C 20.73931,40.312798 21.252194,45.910871 22.001439,49.154066 C 21.84253,51.828309 18.790577,51.39256 19.585585,48.673738 C 19.851829,45.693864 18.285332,39.630301 20.986983,38.702911 C 23.508461,40.80889 25.761847,35.731906 28.452459,38.686226 C 29.921454,39.793194 30.827618,41.709992 30.53125,43.553734 z M 38.807,49.770223 C 42.369034,50.768974 44.523344,46.328688 43.700521,43.358983 C 40.402775,35.546453 32.491199,44.344131 38.807,49.770223 z M 39.941406,38.034203 C 52.085872,39.705642 43.204854,59.098342 34.688722,48.642968 C 32.591886,44.778031 34.383109,38.440132 39.291369,38.051827 L 39.941406,38.034203 L 39.941406,38.034203 z M 51.660156,34.624046 C 49.815978,37.850583 54.789459,38.666222 55.83437,39.23566 C 54.140746,40.715733 50.093061,40.12158 51.562461,43.76212 C 51.004096,46.980523 52.486847,50.037723 55.670614,50.54595 C 53.547788,53.782616 48.41793,50.035495 49.349973,46.519692 C 50.339877,43.686471 48.78131,40.671166 48.467256,38.48357 C 51.099926,37.413599 47.886512,33.32283 51.660156,34.624046 z M 69.859375,43.553734 C 68.966918,45.911557 71.822794,50.463872 68.108124,51.070944 C 66.216214,47.702306 70.259746,41.190256 64.911775,40.046145 C 60.222418,40.285904 60.439194,45.757728 61.367942,48.953683 C 60.705448,53.064855 57.788626,49.900134 58.838379,47.289738 C 58.969709,43.381174 59.006437,39.455087 58.607404,35.565714 C 59.356025,31.632413 62.368269,34.68013 61.01352,37.194316 C 60.38417,39.302538 61.469087,40.653476 62.996248,38.474829 C 66.202089,36.826154 70.863269,39.826451 69.859375,43.553734 z M 85.410156,44.374046 C 83.244849,47.905533 76.447085,42.456344 75.976013,47.444052 C 76.913541,51.724548 83.275324,48.726196 84.393639,50.133773 C 82.109855,53.525123 76.421339,51.860111 74.285335,49.01336 C 71.258247,44.729984 74.614013,37.166516 80.254289,37.96756 C 83.286958,38.284495 85.833914,41.310745 85.410156,44.374046 z M 83.253906,43.741234 C 84.431319,39.039614 74.594812,38.687325 76.291886,43.335226 C 78.284783,44.796048 81.032856,43.090943 83.253906,43.741234 z M 96.554688,40.366234 C 93.290612,38.6882 90.622217,42.519635 90.728522,45.492665 C 90.881925,47.333676 92.330286,52.144465 89.028751,50.905988 C 88.95673,46.763963 88.353312,42.447207 89.31721,38.336643 C 91.040471,38.503437 92.207514,40.668181 93.421468,38.208298 C 94.902478,37.44973 97.690944,38.263668 96.554688,40.366234 z "></path><path style="fill:#ff0000" nodetypes="ccccccccccccccccccccccccccccccccccccccccccccccccccccc" id="flowRoot1898" d="M 17.026327,63.789847 C 0.7506376,64.058469 13.88279,66.387154 13.113883,69.323258 C 8.0472417,70.287093 3.5936285,63.565714 6.8090451,59.370548 C 8.7591553,55.717791 15.269922,55.198361 16.902068,59.393261 C 17.532581,60.758947 17.628237,62.396589 17.026327,63.789847 z M 15.306463,62.656109 C 18.852566,58.713773 7.6543584,56.609143 10.765803,61.304742 C 12.124789,62.217715 13.961359,61.705342 15.306463,62.656109 z M 31.307931,62.391383 C 27.130518,63.524026 24.669863,68.663004 27.470717,72.229472 C 25.946657,74.052316 24.253697,71.076237 24.857281,69.636909 C 23.737444,67.038428 17.399862,72.254246 19.386636,68.888657 C 23.159719,67.551193 22.398496,63.711301 22.06067,60.848671 C 24.064085,60.375294 24.370376,65.772689 27.167918,63.326048 C 28.350126,62.546369 29.927362,61.067531 31.307931,62.391383 z M 37.66875,70.598623 C 33.467314,66.62264 32.517064,77.972723 37.30626,74.466636 C 38.742523,73.853608 40.55904,70.38932 37.66875,70.598623 z M 41.677321,70.973131 C 42.340669,75.308182 36.926157,78.361257 33.331921,76.223155 C 29.43435,74.893988 30.618698,67.677232 35.003806,68.567885 C 37.137393,70.592854 42.140265,67.002221 37.656192,66.290007 C 35.242233,65.914214 35.166503,62.640757 38.036954,63.926404 C 40.847923,64.744926 43.227838,68.124735 41.677321,70.973131 z M 62.379099,76.647079 C 62.007404,78.560417 61.161437,84.034535 58.890565,82.010019 C 59.769679,79.039958 62.536382,72.229115 56.947899,72.765789 C 53.790416,73.570863 54.908257,80.968388 51.529286,79.496859 C 51.707831,76.559817 55.858125,71.896837 50.8321,70.678504 C 45.898113,69.907818 47.485944,75.735824 45.286883,78.034703 C 42.916393,76.333396 45.470823,71.647155 46.624124,69.414735 C 50.919507,67.906486 63.618534,70.878704 62.379099,76.647079 z M 66.426447,83.84905 C 67.616398,85.777591 62.114624,94.492698 62.351124,90.31711 C 63.791684,86.581961 65.730376,78.000636 67.391891,74.85575 C 71.027815,73.781175 76.383067,75.350289 76.591972,79.751898 C 77.048545,83.793048 73.066803,88.429945 68.842187,86.765936 C 67.624386,86.282034 66.56741,85.195132 66.426447,83.84905 z M 74.086569,81.803435 C 76.851893,78.050524 69.264402,74.310256 67.560734,78.378191 C 65.893402,80.594099 67.255719,83.775746 69.700555,84.718558 C 72.028708,85.902224 73.688639,83.888662 74.086569,81.803435 z M 82.318799,73.124577 C 84.30523,75.487059 81.655015,88.448086 78.247183,87.275736 C 78.991935,82.387828 81.291029,77.949394 82.318799,73.124577 z M 95.001985,87.684695 C 78.726298,87.953319 91.858449,90.281999 91.089542,93.218107 C 86.0229,94.18194 81.569287,87.460562 84.784701,83.265394 C 86.734814,79.612637 93.245582,79.09321 94.877729,83.28811 C 95.508245,84.653796 95.603892,86.291438 95.001985,87.684695 z M 93.282122,86.550957 C 96.828223,82.608621 85.630017,80.503993 88.741461,85.199592 C 90.100447,86.112565 91.937018,85.600192 93.282122,86.550957 z "></path></g></svg>';
		const src = xmlHeader + svg;
		const built = await build(src, {vPre: true});

		const {$el} = run(built);
		expect($el.outerHTML).toBe(svg);
	});
});
