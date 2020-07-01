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

	let $ = cheerio.load(src);

	if ($('body').children().length > 1) {
		const $_ = $.load('<div></div>');
		$_('div').html($('body').html());
		$ = $_;
	}

	if (options.vOnce) {
		$('*:first-child').attr('v-once', true);
	}

	if (options.vPre) {
		$('*:first-child').attr('v-pre', true);
	}

	let output = `<template>${$('body').html()}</template>`;

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
