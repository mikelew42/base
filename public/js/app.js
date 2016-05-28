;(xlog.wrap(function appjs(){

$(function(){
	log("weee, we're ready");
	$(document).click(log.wrapc(function docClickHandler(){
		log('this is my click handler');
		log('something would probably happen in here...');
		log('all functionality originating from this click handler will now be organized for your enjoyment');
		myFunc(8, 9, 10);
		log('yerrp');
		globalFunction();
		log('mm yea');
	}));
});


myFunc = log.wrap(function myFunc(a, b, c){
	log("inside myFunc, app.js");
	return a + b;
}); 

log('yo');
log();

var anotherFunc = log.wrapc(function anotherFunc(){
	return myFunc(1, 2) + myFunc(3, 4) * myFunc(5, 6);
}); 

log("ruh roh, double digits");

log.groupc('My test group');
	if (log(5>4)){
		log({
			one: 1,
			two: "two"
		});
	}

	log.groupc("a group");
	log("word");
	log.end();
	
	log("here we go");
	
	globalFunction();
	
	log("a", a = myFunc(1, 2));
	
	log.group("another group");
		log("inside another group");
		myFunc(5, 123);
	log.end();
	
	anotherFunc();
log.end();

log('word');
log(123);
log(true);
log({one: 1, two: "two", three: true, four: function(){} }, "hello", 123)

wrappedGlobalFunction();

anotherFunc();

globalFunction();

log("back to app.js");

globalFunction2();

log("back to app.js");

// log.if(-1).then(function(){
// 	log('yo');
// })

var a = log.wrapc(function a(){
	return true;
});
var c = log.wrapc(function c(){
	return true;
});

var b = log.wrapc(function b(){
	return false;
});
var d = log.wrapc(function d(){
	return false;
});

if ( (a() && c()) && (b() || !d())){

}


var MyClass = log.wrapc(function MyClass(){

});

var myObj = new MyClass();


var testFn = log.wrap(function testFn(){
	log('my test fn');
	// globalFunction3();
	utilJump();
	// log('my test fn');
});

globalFunction4 = function(){
	log('globalFunction4');
};

testFn();

$(function(){

});

}))();