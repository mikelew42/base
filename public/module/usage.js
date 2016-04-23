;(function(){

var module = utils.module;

module.log = true;

var modtest1 = function(){
	console.group('modtest1');
	var testmod1 = module.clone({
		type: "test1"
	});

	testmod1.prop('yo');
	console.assert(testmod1.props.yo);
	testmod1.yo;

	console.groupEnd();
};

// modtest1();

var module2 = utils.module2;
module2.logThisObj = true;

var mod2test1 = function(){
	console.group('mod2test1');
	testmod2 = module2.clone({
		type: 'testmod2',
		one: 1,
		two: "two",
		three: function(){
			console.log('inside fn .three');
		}
	});

	testmod2.assign({
		two: 22,
		four: 4,
		five: "five"
	});

	testmod2.three();
	console.groupEnd();
};

mod2test1();

$(function(){

});

})();