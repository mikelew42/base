// log.js
;(function(){
var is = {
	arr: function(value){
		return toString.call(value) === '[object Array]';
	},
	obj: function(value){
		return typeof value === "object" && !is.arr(value);
	},
	val: function(value){
		return ['boolean', 'number', 'string'].indexOf(typeof value) > -1;
	},
	str: function(value){
		return typeof value === "string";
	},
	num: function(value){
		return typeof value === "number";
	},
	bool: function(value){
		return typeof value === 'boolean';
	},
	fn: function(value){
		return typeof value === 'function';
	},
	sfn: function(value){
		return is.fn(value) && value.Base;
	},
	def: function(value){
		return typeof value !== 'undefined';
	},
	undef: function(value){
		return typeof value === 'undefined';
	},
	simple: function(value){ // aka non-referential
		return typeof value !== 'object' && !is.fn(value); // null, NaN, or other non-referential values?
	}
};

var Base = function Base(o){
	this.assign.apply(this, arguments);
	this.initialize.apply(this, arguments);
};

Base.prototype.initialize = function(){};

Base.prototype.assign = function(o){
	for (var i in o)
		this[i] = o[i];
	return this;
};

var getBacktrace = function(){
	var stack =
		((new Error).stack + '\n');

		// console.log(stack);

		stack = stack
			.replace(/^\s+(at eval )?at\s+/gm, '') // remove 'at' and indentation
			.replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2')
			.replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)')
			.replace(/^(.+) \((.+)\)$/gm, '$1```$2')
			.split('\n')
			.slice(1, -1);

	var backtrace = [];

	for (var i in stack){
		stack[i] = stack[i].split('```');
		var bt = {
			func: stack[i][0],
			fullPathAndLine: stack[i][1]
		};

		var pathBreakdown = stack[i][1].split(':');
		bt.file = pathBreakdown[1].replace(/^.*[\\\/]/, '');
		bt.line = pathBreakdown[2];
		bt.linePos = pathBreakdown[3];

		backtrace.push(bt);
	}

	return backtrace; //.slice(3);
};

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}

var noop = function(){};

var bg = "background: #eee;";

log = function(val){
	new Log({
		arguments: arguments,
		trace: getBacktrace()[2]
	});

	return val; // always return 1st arg to be an "identity" fn 
};
xlog = function(val){ return val; };

/* TODO
This needs to be coordinated with other margins, but the indentation value
could be dramatically changed for better grouping clarity.  Maybe its a function of depth, so
as depth increases, the indentation decreases, to avoid running off the page. */
var groupStyles = 
	"margin-left: -8px; \
	padding: 3px 5px 2px; \
	border-bottom: 1px solid #ddd; \
	background: #eee; \
	line-height: 16px;";

log.end = function(){
	log.closeCurrentGroup();
};
xlog.end = noop;

log.openGroups = [];
log.currentFile = "";
log.addGroup = function(group){
	log.openGroups.push(log.currentGroup);
	log.currentGroup = group;
};

log.add = function(group){
	log.openGroups.push(log.currentGroup);
	log.currentGroup = group;
};

log.closeCurrentGroup = function(){
	// console.log("log.closeCurrentGroup", log.currentGroup);
	if (log.currentGroup.type !== "root" && log.openGroups.length){
		log.currentGroup.close();
		log.currentGroup = log.openGroups.pop();
		return true;
	} else {
		return false;
	}
};




/* * * * * * * * * * *
 *  LOG
 */

var Log = function Log(){
	this.assign.apply(this, arguments);
	this.initialize();
};

Log.prototype = Object.create(Base.prototype);

Log.prototype.assign({
	method: "log",
	initialize: function(){
		this.autoFileGroup();
		this.log(this.args());
	},
	autoFileGroup: function(){
		if (log.currentFile !== this.trace.file) {
			if (log.currentGroup.type == "file"){
				log.closeCurrentGroup();
			}

			if (log.currentFile !== this.trace.file){
				log.add(new FileGroup({
					trace: this.trace,
					lastFile: log.currentFile
				}));
			}
		}
	},
	args: function(){
		if (this._args){
			return this._args;
		} else {
			this.arguments = this.arguments || [];
			this._args = Array.prototype.slice.call(this.arguments);
			this.customArgs();
			return this._args;
		}
	},
	// provide override point in args fn above
	customArgs: function(){
		this._args.unshift("%c" + this.trace.line, groupStyles);
	},
	log: function(args){
		console[this.method].apply(console, args);
	}
})




/* * * * * * * * * * *
 *  GROUP
 
Cleanup groups with timeout?
 */

	var Group = function Group(){
		this.assign.apply(this, arguments);
		this.initialize();
	};

	Group.prototype = Object.create(Log.prototype);

	Group.prototype.assign({
		method: "group",
		open: true,
		close: function(){
			if (this.open){
				console.groupEnd();
				this.open = false;
			} else {
				console.warn("already closed!!");
			}
		}
	});

	log.currentGroup = new Group({
		type: "root",
		initialize: function(){},
		open: true,
		close: function(){
			console.warn("can't close root group");
		}
	});



/* * * * * * * * * * *
 *  FILE GROUP

Make sure to pass lastFile (which should be log.currentFile)
 */

var FileGroup = function FileGroup(){
	Group.apply(this, arguments);
};

FileGroup.prototype = Object.create(Group.prototype);

FileGroup.prototype.assign({
	type: "file",
	initialize: function(){
		log.currentFile = this.trace.file;
		// log.autoFileGroup(this.trace());
		this.log(this.args());
	},
	customArgs: function(){
		this._args.unshift("%c"+ this.trace.file, groupStyles);
	},
	close: function(){
		if (this.open){
			console.groupEnd();
			log.currentFile = this.lastFile;
			this.open = false;
		} else {
			console.warn("already closed!!");
		}
	}
});




log.makeFileGroup = function(trace){
	log.add(new FileGroup({
		trace: trace,
		lastFile: log.currentFile
	}));
};

log.autoFileGroup = function(trace){
	if (!log.currentFile){
		log.makeFileGroup(trace);
	} else if (log.currentFile !== trace.file) {
		if (log.currentGroup.type == "file"){
			log.closeCurrentGroup();
		}

		if (log.currentFile !== trace.file){
			log.makeFileGroup(trace);
		}
	}
};

// must be closed!!
/* NEH!  Allow the last arg of this fn to be an anonymous function, which will be a much
more robust end of the group.  A separate startGroup and startGroupc could be used for times in which continuity
cannot be maintained. */
log.group = function(name){
	log.add(new Group({
		trace: getBacktrace()[2],
		type: "user",
		arguments: arguments
	}));
};
xlog.group = noop;

log.groupc = function(){
	log.add(new Group({
		trace: getBacktrace()[2], 
		type: "user",
		arguments: arguments,
		method: "groupCollapsed"
	}));
};
xlog.groupc = noop;

log.wrap = function(fn){
	// console.log('wrap bt', fn.name, getBacktrace());
	var bt = getBacktrace(),
		trace = bt[2],
		def = {
			name: fn.name,
			argNames: getParamNames(fn),
			file: trace.file,
			line: trace.line
		};
	return function(){
		// this can probably be condensed into one function call..?
		return log.ret(fn.apply(this, log.args(arguments, def)));
	};
};
xlog.wrap = function(fn){ return fn; }

log.wrapx = function(fn){
	var bt = getBacktrace(),
		trace = bt[2],
		argNames = getParamNames(fn),
		def = {
			name: fn.name,
			argNames: argNames,
			file: trace.file,
			line: trace.line,
			expand: true
		};
	return function(){
		return log.ret(fn.apply(this, log.args(arguments, def)));
	};
}
xlog.wrapx = function(fn){ return fn;}

log.wrapi = function(fn, name, argNames){
	// console.log('wrap bt', fn.name, getBacktrace());
	var bt = getBacktrace(),
		trace = bt[2],
		argNames = getParamNames(fn),
		def = {
			name: fn.name,
			argNames: argNames,
			file: trace.file,
			line: trace.line
		};
	return function(){
		return log.ret(fn.apply(this, log.args(arguments, def)));
	};
};

log.newFunctionGroup = function(name, argNames, defFile, callTrace){
	var functionGroup = {
		open: true,
		type: "function",
		close: function(){
			if (this.open){
				console.groupEnd();
				this.open = false;

				// do we need to track open files?
				log.currentFile = this.callTrace.file;

				// if (log.currentFileGroup.fake && log.currentFileGroup.file === this.defFile)
				// 	log.currentFileGroup = log.openFileGroups.pop();

			} else {
				console.warn("already closed!!");
			}
		},
		name: name,
		argNames: argNames,
		// fileDepth: log.openFileGroups.length,
		defFile: defFile,
		callTrace: callTrace
	};

	log.addGroup(functionGroup);
};

log.ret = function(ret){
	if (is.def(ret)){
		if (log.currentGroup.type == "function")
			log.closeCurrentGroup();
		else
			console.error("log.ret attempting to close non-function group");
		// console.groupEnd();
		console.log('%creturn', groupStyles + "margin-left: 6px", ret);
	} else {
		console.log('%creturn', groupStyles, ret);
		// console.groupEnd();
		if (log.currentGroup.type == "function")
			log.closeCurrentGroup();
		else
			console.error("log.ret attempting to close non-function group");
	}
	return ret;
};

log.fnCallLabel = function(callTrace, def){};

log.args = function(args, def){
	var bt = getBacktrace(), 
		trace = bt[3],
		name = def.name,
		argNames = def.argNames;

	log.autoFileGroup(trace);

	// build the function call label
	var label = [ "%c" + trace.line, groupStyles, name + "(" ];

	if (argNames.length){
		for (var i in argNames){
			if (argNames[i])
				label.push(argNames[i]+":");
			label.push(args[i]);
			if (i < argNames.length - 1){
				label.push(",");
			}
		}
	}
	label.push(")");

	if (def.expand)
		console.group.apply(console, label);
	else
		console.groupCollapsed.apply(console, label);

	log.newFunctionGroup(name, argNames, def.file, trace);

	// if fn is defined elsewhere, label the file change
	if (!log.currentFile || (log.currentFile !== def.file)){
		console.log("%c"+def.file, groupStyles + "font-weight: bold");
		log.currentFile = def.file;
	}

	return args;
};

log.cond = function(value){
	return {
		__cond: true,
		value: value,
		true: !!value,
		then: function(fn){
			log.autoFileGroup();
			// if ()
		}
	};
};

/*
params:  truthy || { __cond: true }
*/
log.if = function(cond){
	var trace = getBacktrace()[2];
	// console.log(trace);
	if (is.obj(cond) && cond.__cond){
		return cond;
	} else {
		if (cond){
			return {
				then: function(fn){
					log.autoFileGroup(trace);
					// log(trace);
					console.group('%c'+trace.line + '%cif', groupStyles,"color: green; margin-left: 5px", cond);
					fn();
					console.groupEnd();
					return {
						elseIf: function(cond){
							return {
								then: function(){},
								else: function(){}
							}
						},
						else: function(fn){}
					}
				},
				and: function(cond){

				},
				or: function(cond){

				}
			};
		} else {
			return {
				then: function(fn){
					log.autoFileGroup(trace);
					console.log("%c" + trace.line + "%cif", groupStyles, "color: red; margin-left: 5px;", cond);
					return {
						elseIf: function(cond){
							if (is.obj(cond) && cond.__cond){
								// evaluate cond
							} else {
								if (cond){
									return {
										then: function(fn){
											console.group('else if true');
											fn();
											console.groupEnd();
										}
									};
								} else {

								}
							}
						}
					};
				},
				and: function(cond){
					// doesn't matter if first cond is false, but we still need to capture else if and else...
					return {
						elseIf: function(){},
						else: function(){}
					}
				},
				or: function(){}
			};
		}
	}
};

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

wrappedGlobalFunction = log.wrap(function wrappedGlozzzzbalFunction(){
	log("wrappedGlobalFunction in log.js");
	globalFunction();
	log("calling myFunc in app.js");
	myFunc();
	log("fn ending");
});

globalFunction = log.wrap(function globalFunction(){
	log('globalFunction, from log.js');
	log("bt"); log(getBacktrace());
	log.group('a group inside globalFunction', 1234, function(){});
	log('whatup');
	log.end();
	log("back to root level of globalFunction");
});

globalFunction2 = function(){
	// log('globalFunction, from log.js');
	log.group('a group inside globalFunction2', 1234, function(){});
	log('whatup');
	log('whatup');
	log('whatup');
	log.end();
};


})();

