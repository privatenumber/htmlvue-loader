# htmlvue-loader
Html to Vue Loader

## :rocket: Quick setup

#### Install
```sh
npm i htmlvue-loader
```

#### Add to your Webpack config
```js
...

module: {
	rules: [
		...,
		{
			test: /\.html$/,
			use: [
				'vue-loader',
				'htmlvue-loader'
			]
		}
	]
}

...
```

## Options

### `vPre` <`Boolean`>
Adds [`v-pre`](https://vuejs.org/v2/api/#v-pre) to the root element.
> Skip compilation for this element and all its children. You can use this for displaying raw mustache tags. Skipping large numbers of nodes with no directives on them can also speed up compilation.

### `vOnce` <`Boolean`>
Adds [`v-once`](https://vuejs.org/v2/api/#v-once) to the root element.
> Render the element and component **once** only. On subsequent re-renders, the element/component and all its children will be treated as static content and skipped. This can be used to optimize update performance.

### `transform` <`Object|Function`>
A function to transform the html string. If you're using a component in the transformation and you'd like to register it, declare it in `transform.components`.
```js
transform: {
	transformer: svg => `<rand-comp>${svg}</rand-comp>`,
	components: {
		RandComp: './rand-comp.vue'
	}
}
```
