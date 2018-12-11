const outdent = require('outdent');
const cheerio = require('cheerio');
const loaderUtils = require('loader-utils');

module.exports = function(src) {
	this.cacheable(true);

	const options = loaderUtils.getOptions(this) || {};

	let $ = cheerio.load(src);

	if ($('body').children().length > 1) {
		const $_ = $.load('<div></div>');
		$_('div').html($('body').html());
		$ = $_;
	}

	console.log(options);
	if (options.vPre) {
		$('*:first-child').attr('v-pre', true);
	}

	if (options.vOnce) {
		$('*:first-child').attr('v-once', true);
	}

	const html = $('body').html().replace('="true"', '');

	return `<template>${html}</template>`;
};
