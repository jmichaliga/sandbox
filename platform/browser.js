/**
 * @class browser
 * @namespace medialets
 * @requires core.js
 * @author ray.matos@com
 * @source http://creative.medialytics.com/javascript/browser.js
 * @compressed http://creative.medialytics.com/javascript/browser.min.js
 * @version 1.0
 */
(function(){
		nua = navigator.userAgent;
		parts = nua.split(/\s*[;)(]\s*/);
		versionNo = parts[3].split(" ").pop(); 
		platform = parts[3].split(" ").shift();
	
		browser = {
			isiPad : nua.match(/iPad/i) != null,
			isiPod : nua.match(/iPod/i) != null,
			isiPhone : nua.match(/iPhone/i) != null,
			isAndroid : nua.match(/Android/i) != null,
			isMac : nua.match(/Macintosh/i) != null,
			platform : platform,
			versionNum : versionNo,
			mainVersion : (versionNo.split('.').length === 1 ? versionNo.split('_')[0] : versionNo.split('.')[0])
		};
		browser.isiOS = (browser.isiPad || browser.isiPhone || browser.isiPod) ? true : false;
		
}());
