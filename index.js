const outdent = require('outdent');
const cheerio = require('cheerio');

module.exports = function(src) {
	this.cacheable(true);

	const nodes = cheerio.parseHTML(src);
	if (nodes.length > 1) {
		src = `<div>${src}</div>`;
	}

	return outdent`
		<template>
			${src}
		</template>
	`;
};
