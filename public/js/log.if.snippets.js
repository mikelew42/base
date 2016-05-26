/*
params:  truthy || { __cond: true }
*/
// log.if = function(cond){
// 	var trace = getBacktrace()[2];
// 	// console.log(trace);
// 	if (is.obj(cond) && cond.__cond){
// 		return cond;
// 	} else {
// 		if (cond){
// 			return {
// 				then: function(fn){
// 					log.autoFileGroup(trace);
// 					// log(trace);
// 					console.group('%c'+trace.line + '%cif', groupStyles,"color: green; margin-left: 5px", cond);
// 					fn();
// 					console.groupEnd();
// 					return {
// 						elseIf: function(cond){
// 							return {
// 								then: function(){},
// 								else: function(){}
// 							}
// 						},
// 						else: function(fn){}
// 					}
// 				},
// 				and: function(cond){

// 				},
// 				or: function(cond){

// 				}
// 			};
// 		} else {
// 			return {
// 				then: function(fn){
// 					log.autoFileGroup(trace);
// 					console.log("%c" + trace.line + "%cif", groupStyles, "color: red; margin-left: 5px;", cond);
// 					return {
// 						elseIf: function(cond){
// 							if (is.obj(cond) && cond.__cond){
// 								// evaluate cond
// 							} else {
// 								if (cond){
// 									return {
// 										then: function(fn){
// 											console.group('else if true');
// 											fn();
// 											console.groupEnd();
// 										}
// 									};
// 								} else {

// 								}
// 							}
// 						}
// 					};
// 				},
// 				and: function(cond){
// 					// doesn't matter if first cond is false, but we still need to capture else if and else...
// 					return {
// 						elseIf: function(){},
// 						else: function(){}
// 					}
// 				},
// 				or: function(){}
// 			};
// 		}
// 	}
// };

/* 

log.if with log.cond

log.if(bool || truthy || { __cond: true });

if(something){}
==> log.if(something).then(function(){});
==> if(log.if(something)){
	log.then('optional message');
}

The above two options are incompatible APIs.  Either log.if needs to return
the value passed in, or it needs to be a delayed fn...

log.if(a && b).then(function(){
	
}).elseIf(c || d).then(function(){
	
}).else(function(){
	
});

How about 
log.if(a).and(b).then(fn).elseIf(c).or(d).then(fn).else(fn);
Without buffered logging, each then block doesn't know if there's a subsequent block.
So, these blocks are then standalone.  The condition can be somewhat buffered, I suppose, but it
doesn't need to be. There will be a group for each block, with the condition as the group title:

if (true) // green
	# then
else // gray

if (true && false) // red
else if (true) // green
	# then
else // gray


log.cond(value) 

value: bool, truthy, or __cond: true

returns:  an object that computes its value as its manipulated, but returns an object

example:

log.cond(a).and(b)
log.cond(log.cond(a).and(b)).or(c)

*/



/*
Others:
log.exp(a).plus(b)
log.math(b).times(c)


if (a && b || (c && d)){

} else if (blah){

} else {

}

log.if(a).and(b).or(c).and(d).then(function(){

}).elseIf(blah).then(function(){

}).else(function(){

});



This way, we can pass a truthy value alone to the log.if
Or, if we drop in a condition object { __cond: true } flag,
the log.if can execute it, and handle the outcomes.

log.if(log.cond(a).and(b)).then(function(){

});

*/