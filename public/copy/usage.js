;(function(){
	
var copy1 = utils.copy1;
// copy1

var copy1test1 = function(){
	console.group('copy1test1');

	console.assert(copy1(5) === 5);
	console.assert(copy1('yo') === 'yo');
	var obj = {
		one: 1,
		two: "two"
	};

	var objCopy = copy1(obj);

	for (var i in obj){
		console.assert(obj[i] === objCopy[i]);
	}
	console.assert(objCopy != obj, 'Not copying');

	console.groupEnd();
};

copy1test1();

$(function(){

});

})();