/**
 * @class medialets.browser
 * @namespace medialets
 * @requires medialets.core.js
 * @author ray.matos@medialets.com
 * @source http://creative.medialytics.com/javascript/medialets.browser.js
 * @compressed http://creative.medialytics.com/javascript/medialets.browser.min.js
 * @version 1.0
 */

(function(medialets) {
	if (medialets) {	
		medialets.browser = {
			isiPad : navigator.userAgent.match(/iPad/i) != null,
			isiPod : navigator.userAgent.match(/iPod/i) != null,
			isiPhone : navigator.userAgent.match(/iPhone/i) != null,
			isAndroid : navigator.userAgent.match(/Android/i) != null
		};
		medialets.browser.isiOS = (medialets.browser.isiPad || medialets.browser.isiPhone || medialets.browser.isiPod) ? true : false
	}
}(typeof medialets !== 'undefined') ? medialets : false);
