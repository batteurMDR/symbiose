/**
 * A CSS stylesheet.
 * @param {String} path The path to the CSS file.
 * @param {String} [container] The element on which CSS rules will be applied.
 * @since 1.0 alpha 1
 * @constructor
 */
Webos.Stylesheet = function (path, container) {
	if (!/^(\/|~\/)/.test(path)) { //Old path notation support - deprecated
		path = '/'+path;
	}
	
	if (Webos.Stylesheet._cache[path]) { //Is the file in cache ?
		Webos.Stylesheet.insertCss(Webos.Stylesheet._cache[path], container);
		return;
	}
	
	new Webos.ServerCall({
		'class': 'FileController',
		method: 'getContents',
		arguments: {
			file: path
		},
		async: false
	}).load(function(response) {
		var css = response.getStandardChannel();
		if (css) { //If there is some CSS
			Webos.Stylesheet._cache[path] = css;
			Webos.Stylesheet.insertCss(css, container); //Insert CSS in the page
		}
	});
};

/**
 * Cache for CSS stylesheets.
 * @private
 * @static
 */
Webos.Stylesheet._cache = {};

Webos.Stylesheet._supportsScoped = null;
Webos.Stylesheet.supportsScoped = function () {
	if (typeof Webos.Stylesheet._supportsScoped == 'boolean') {
		return Webos.Stylesheet._supportsScoped;
	}

	var check = document.createElement( 'style' ),
		scopeSupported = (undefined !== check.scoped);

	Webos.Stylesheet._supportsScoped = scopeSupported;
	return scopeSupported;
};

/**
 * Apply some CSS rules .
 * @param {String} css CSS rules.
 * @param {String} [container] The element on which CSS rules will be applied. If ommited, CSS rules will be applied to the whole page.
 * @static
 */
Webos.Stylesheet.insertCss = function (css, container) {
	var scoped = (Webos.Stylesheet.supportsScoped() && container && $(container).length);
	//scoped = false; //Doesn't work very well

	if (!scoped && container) {
		if (typeof container != 'string') {
			container = '#'+$(container).attr('id');
		}

		css = css
			.replace(/\/\*([\s\S]*?)\*\//g, '') //Delete comments
			.replace(/([\s\S]+?)\{([\s\S]*?)\}/g, function(str, p1, p2) { //Replace each selector
				var result = '';
				
				p1 = p1.replace(/\s+/g, ' ');
				
				if (/(^\s*@|%\s*$)/.test(p1)) { //Not a selector ?
					if (/^\s*(@.+;)+/.test(p1)) {
						result += /@.+;/g.exec(p1).join('');
					} else {
						return p1+'{'+p2+'}';
					}
				}
				
				var selectors = p1.split(',');
				
				result += container+' '+selectors.join(', '+container+' ')+'{'+p2+'}';
				result = result.replace(/\s+/g, ' ');
				return result;
			});
	}

	//Insert CSS rules
	var $cssTag = $('<style></style>', { 'type': 'text/css' }).text(css);

	if (scoped) {
		$cssTag.prop('scoped', true);
		$(container).prepend($cssTag);
	} else {
		$('head').append($cssTag);
	}

	return $cssTag;
};

Webos.Stylesheet.removeCss = function (stylesheet) {
	$(stylesheet).remove();
};
