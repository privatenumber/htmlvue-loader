const outdent = require('outdent');
const cheerio = require('cheerio');
const loaderUtils = require('loader-utils');

module.exports = function (src) {
	this.cacheable(true);

	const options = loaderUtils.getOptions(this) || {};

	const components = options.transform && options.transform.components;
	const transformer = (options.transform && options.transform.transformer) || options.transform;
	if (typeof transformer === 'function') {
		src = transformer(src);
	}

	let $ = cheerio.load(src, {xmlMode: true});

	if ($.root().children().length > 1) {
		$ = cheerio.load(`<div>${$.xml()}</div>`, {xmlMode: true});
	}

	const rootElement = $.root().children().first();

	if (options.vOnce) {
		rootElement.attr('v-once', 'true');
	}

	if (options.vPre) {
		rootElement.attr('v-pre', 'true');
	}

	let output = `<template>${$.xml(rootElement)}</template>`;

	if (components) {
		output += outdent`
		<script>
			${Object.entries(components).map(([k, v]) => `import ${k} from '${v}';`)}
			export default { components: { ${Object.keys(components)} } };
		</script>
		`;
	}

	return output;
};
