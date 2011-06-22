
function rad_deg(radians) {
	var pi = Math.PI;
	return ra_de = ((eval(radians))*(180/pi));
}

function deg_rad(degrees) {
	var pi = Math.PI;
	return de_ra = ((eval(degrees))*(pi/180));
}


var r = function(element, delta, axis){
	switch (axis){
		case "x":
			element.style.webkitTransform = "rotateX( "+delta+"deg )";
			break;			
		case "y":
			element.style.webkitTransform = "rotateY("+delta+"deg)";
			break;
		case "z":
			element.style.webkitTransform = "rotateZ("+delta+"deg)";
			break;
	}
}, 


rMatrix = function(element, delta, axis){

	
	var d = deg_rad(-delta);
	
	var sinD = Math.sin(d);
	var cosD = Math.cos(d);
	
	switch (axis){

		case "z":
	
			$m00 = cosD;
			$m01 = -sinD;
			$m02 = 0;
			$m03 = 0;
			
			$m10 = sinD;
			$m11 = cosD;
			$m12 = 0;
			$m13 = 0;
			
			$m20 = 0;
			$m21 = 0;
			$m22 = 1;
			$m23 = 0;
			
			$m30 = 0;
			$m31 = 0;
			$m32 = 0;
			$m33 = 1;
			
			element.style.webkitTransform = "matrix3d("+$m00+", "+$m01+", "+$m02+", "+$m03+","+$m10+", "+$m11+", "+$m12+", "+$m13+","+$m20+", "+$m21+", "+$m22+", "+$m23+","+$m30+", "+$m31+", "+$m32+", "+$m33+")";
			break;
	}

};