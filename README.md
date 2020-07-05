# htmlvue-loader <a href="https://npm.im/htmlvue-loader"><img src="https://badgen.net/npm/v/htmlvue-loader"></a> <a href="https://npm.im/htmlvue-loader"><img src="https://badgen.net/npm/dm/htmlvue-loader"></a> <a href="https://packagephobia.now.sh/result?p=htmlvue-loader"><img src="https://packagephobia.now.sh/badge?p=htmlvue-loader"></a>

Webpack loader for compiling HTML to Vue

## :raising_hand: Why?
- 🚰 **Pipes to `vue-loader`** and doesn't depend on `vue-template-compiler`
- ✍️ **Supports SVG** and any other XML format!
- ♻️ **Reusability** Preserve HTML/SVG files for reusability
- ⚙️ **Configurable** Add `v-pre`, `v-once` directives and transformers
- 🔥 **Fast** Only does the bare minimum
## :rocket: Quick setup

### Install
```sh
npm i -D htmlvue-loader
```

### Add to your Webpack config
Insert `vue-loader` above it to compile it as a Vue component.

```js
...

module: {
	rules: [
		...,
		{
			test: /\.(html|svg)$/,
			use: [
				'vue-loader',
				'htmlvue-loader'
			]
		}
	]
}

...
```

## ⚙️ Options
- `vPre` `<Boolean>`
  Adds [`v-pre`](https://vuejs.org/v2/api/#v-pre) to the root element.
  > Skip compilation for this element and all its children. You can use this for displaying raw mustache tags. Skipping large numbers of nodes with no directives on them can also speed up compilation.

- `vOnce` `<Boolean>`
  Adds [`v-once`](https://vuejs.org/v2/api/#v-once) to the root element.
  > Render the element and component **once** only. On subsequent re-renders, the element/component and all its children will be treated as static content and skipped. This can be used to optimize update performance.

- `transform` `<Object|Function>`
  A function to transform the html string. If you're using a component in the transformation and you'd like to register it, declare it in `transform.components`.
  ```js
  transform: {
  	transformer: svg => `<rand-comp>${svg}</rand-comp>`,
  	components: {
  		RandComp: './rand-comp.vue'
  	}
  }
  ```
