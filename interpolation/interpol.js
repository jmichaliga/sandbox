
var card = '<div id="card-{_data.cardNum}" class="card"><figure class="back"><div class="productImg"><img class="product" src="{_data.productImageSrc}"/></div><div class="content"><p class="intro">{_data.introText}</p><hr/><p><strong>{_data.productBrand}</strong></p><p class="desc">{_data.productDesc}</p><p class="price">{_data.price}</p><p><strong>Original Price</strong></p><p class="oldPrice">{_data.originalPrice}</p><hr/><div class="buttons"><button class="likeThis gold awesome">I like this</button><button {_data.firstNext} class="nextItem grey awesome">Next item</button></div></div></figure><figure class="front"></figure></div><!--/card-{_data.cardNum}-->';

dealCards = function(obj){
	//for(x in obj.cards){
 		//document.getElementById("content").innerHTML += medialets.interpolate(card, obj.cards[x]);
		medialets.interpolate(card, obj.cards ,"content");  		
	//} 
};
	
	


