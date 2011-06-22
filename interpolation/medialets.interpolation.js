/**
 * @class medialets.interpolation
 * This plugin allows you to set up an ad to auto-dismiss. 
 * @namespace medialets
 * @requires medialets.js
 * @author justin.michaliga@medialets.com, ali.hasan@medialets.com
 * @source http://creative.medialytics.com/javascript/medialets.interpolation.js
 * @compressed http://creative.medialytics.com/javascript/medialets.interpolation.min.js
 * @version 1.0
 * 
 * 
 * @usage <script src="js/medialets.js" type="text/javascript" charset="utf-8"></script>
<script src="js/medialets.interpolation.js" type="text/javascript" charset="utf-8"></script>
 ...
<script type="text/javascript">

var card = '<div id="card-{_data.cardNum}" class="card"><figure class="back"><div class="productImg"><img class="product" src="{_data.productImageSrc}"/></div><div class="content"><p class="intro">{_data.introText}</p><hr/><p><strong>{_data.productBrand}</strong></p><p class="desc">{_data.productDesc}</p><p class="price">{_data.price}</p><p><strong>Original Price</strong></p><p class="oldPrice">{_data.originalPrice}</p></div></figure><figure class="front"></figure></div><!--/card-{_data.cardNum}-->';

dealCards({"cards":[
    {"cardNum" : 8,
        "productImageSrc" :"imgs/Product8.jpg",
        "introText" : "Men's Shoes & At Up To 60% off Retail.",
        "productBrand" : "Antonio Maurizi",
        "productDesc" : "Suede Ankle Boots",
        "price" : "$229",
        "originalPrice" : "$615",
        "linkThru" : "http://www.gilt.com/thedailymen"   
    },
    
	{ "cardNum" : 7,
        "productImageSrc" : "imgs/Product7.jpg",
        "introText" : "Up To 60% Off On Women's Shoes & Accessories.",
        "productBrand" : "Charles Jourdan",
        "productDesc" : "Stingray Briana Peep Toe Pump",
        "price" : "$99",
        "originalPrice" : "$255",
        "linkThru" : "http://www.gilt.com/thedailywomen"     
    }]
  });

dealCards = function(obj){
	medialets.interpolate(card, obj.cards ,"content");  		
};

</script>
 */

String.prototype.interpolate = function ( vMap )
{
	return this.replace( /\{([^}]+)\}/g,
		function ( preval, value ) {
			return vMap( value );
		});
};

medialets.interpolate = function (_template, _data, _target){
	
	var vMap = function ( _x_ ) { return eval( _x_ ); };
	
	if (toString.call(_data) === '[object Array]') {
		var outputString = '',
			outputArray = [];
			
		for(i in _data){
			if (_target) {
				outputString += medialets.interpolate(_template, _data[i], _target);
			}
			else {
				outputArray.push(medialets.interpolate(_template, _data[i], _target));
			}
		}
		
		if (_target) {
			$m(_target).innerHTML = outputString;
			return outputString;
		}
		else {
			return outputArray;
		}
		
	}
	else {
		//Variables in template must be formatted like: {_data.key}
		return _template.interpolate( vMap );
	}
}
