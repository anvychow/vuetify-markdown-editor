import marked from 'marked';
import md5 from 'crypto-js/md5';
import hljs from 'highlight.js';
import 'highlight.js/styles/tomorrow-night.css';
import { mergeConfig, mergeOptions } from './config';

/* Markdown renderer */
let options;
let config;
let cache = {};

// Create your custom renderer.
const markedRenderer = new marked.Renderer();

// Highlight code
markedRenderer.code = (code, language) => {
	// For meraid
	if (options.mermaid && language === 'mermaid') {
		// Use cache to accelerate rendering
		if (cache.mermaid) {
			const hash = md5(code).toString();
			if (cache.mermaid[hash]) {
				return `<div class="mermaid-cached">${cache.mermaid[hash]}</div>`;
			}
		}
		return `<div class="mermaid">${code}</div>`;
	}

	// Check whether the given language is valid for highlight.js.
	const validLang = !!(language && hljs.getLanguage(language));
	// Highlight only if the language is valid.
	const highlighted = validLang ? hljs.highlight(language, code).value : code;
	// Render the highlighted code with `hljs` class.
	return `<pre><code class="hljs ${language}">${highlighted}</code></pre>`;
};

// Set the renderer to marked.
marked.setOptions({
	renderer: markedRenderer
});


/* Katex renderer */

import katex from 'katex';
import 'katex/dist/katex.min.css';

// Escape special characters
function regexEscape(text) {
	return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function renderMath(text) {
	if (!options.katex)
		return text;
	// [\s\S] match all characters including \n
	for (const delimiter of config.katex.delimiters) {
		// s flag allows '.' to match newline
		const left = regexEscape(delimiter.left);
		const right = regexEscape(delimiter.right);

		const re = new RegExp(`${left}(.*?)${right}`, 'gs');
		text = text.replace(re, (_match, p1) => {
			return katex.renderToString(p1, delimiter.options);
		});
	}
	return text;
}

const render = (text, customOptions, customConfig, renderCache = {}) => {
	options = mergeOptions(customOptions);
	config = mergeConfig(customConfig);
	cache = renderCache;

	// text can't be null or undefined
	text = text || ''
	return renderMath(marked(text));
};

export default render;
