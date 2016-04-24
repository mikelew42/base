;(function appjs(){

myFunc = log.wrap(function myFunc(a, b, c){
	log("inside myFunc, app.js");
	return a + b;
}); 

log('yo');
log();

var anotherFunc = xlog.wrap(function anotherFunc(){
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
	
	myFunc(1, 2);
	
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

console.groupCollapsed('Collapsed Group');
console.log('/path/to/file.js', '@ line 234');
console.groupEnd();
console.log("%creturn", "margin-left: 20px;", 2324)

globalFunction();

log("back to app.js");

globalFunction2();

log("back to app.js");

$(function(){

});

})();