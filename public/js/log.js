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
			fullPathAndLine: stack[i][1],
			// full: stack
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

log = function(){
	return log.log.apply(log, arguments);
};
xlog = function(val){ return val; };

var groupStyles = 
	"margin-left: -8px; \
	padding: 3px 5px 2px; \
	border-bottom: 1px solid #ddd; \
	background: #eee; \
	line-height: 16px;";

log.lastFile = "";
log.log = function(val){
	var trace = getBacktrace()[3],
		args = Array.prototype.slice.call(arguments);

	log.fileGroup(trace);
	args.unshift('%c' + trace.line, groupStyles);
	console.log.apply(console, args);

	return val; // always return 1st arg to be an "identity" fn 
};

log.end = function(){
	log.closeCurrentGroup();
};
xlog.end = noop;

log.openGroups = [];
log.openUserGroups = [];
log.openFileGroups = [];
log.addGroup = function(group){
	if (group.type == "file"){
		log.openFileGroups.push(log.currentFileGroup);
		log.currentFileGroup = group;
	} else if (group.type == "user") {
		log.openUserGroups.push(log.currentUserGroup);
		log.currentUserGroup = group;
	}
	log.openGroups.push(log.currentGroup);
	log.currentGroup = group;
};
log.closeCurrentGroup = function(){
	console.log("log.closeCurrentGroup", log.currentGroup);
	if (log.currentGroup.type !== "root" && log.openGroups.length){
		log.currentGroup.close();
		if (log.currentGroup.type == "user"){
			log.currentUserGroup = log.openUserGroups.pop();
		} else if (log.currentGroup.type == "file"){
			log.currentFileGroup = log.openFileGroups.pop();
		}
		log.currentGroup = log.openGroups.pop();
		return true;
	} else {
		return false;
	}
};

log.newUserGroup = function(){
	var userGroup = {
		type: "user",
		open: true,
		close: function(){
			if (this.open){
				console.groupEnd();
				this.open = false;
			} else {
				console.warn("already closed!!");
			}
		}
	};

	log.addGroup(userGroup);
};

log.currentGroup = {
	type: "root",
	open: true,
	close: function(){
		console.warn("can't close root group");
	}
};

log.cleanup = function(){
	setTimeout(function(){
		log.closeAll();
	}, 0);
};
// hot potato pattern :D
log.closeAll = function(){
	while (log.closeCurrentGroup()){}
};

log.newFileGroup = function(file){
	var fileGroup = {
		type: "file",
		file: file,
		open: true,
		close: function(){
			if (this.open){
				console.groupEnd();
				this.open = false;
			} else {
				console.warn("already closed!!");
			}
		}
	};

	log.addGroup(fileGroup);
};


log.lastGroupType = "root";

log.fileGroup = function(trace){
	// if log comes from a different file
	if (!log.currentFileGroup || (log.currentFileGroup && log.currentFileGroup.file !== trace.file)){
		// and if current group type is file, 
		if (log.currentGroup.type == "file"){
			// console.warn("auto closing file group");
			log.closeCurrentGroup();
		}
		
		// if the above block is executed, currentFileGroup.file changes
		if (!log.currentFileGroup || (log.currentFileGroup.file !== trace.file)){
			// console.warn("auto file group");
			console.group("%c"+trace.file, groupStyles);
			log.newFileGroup(trace.file);
		}
	}
};

log.lastGroupTypes = [];

// must be closed!!
log.group = function(name){
	var trace = getBacktrace()[2],
		args = Array.prototype.slice.call(arguments);

	log.fileGroup(trace);
	args.unshift("%c" + trace.line, groupStyles )
	console.group.apply(console, args);
	log.newUserGroup();
};
xlog.group = noop;

log.groupc = function(){
	var trace = getBacktrace()[2],
		args = Array.prototype.slice.call(arguments);

	log.fileGroup(trace);
	args.unshift("%c" + trace.line, groupStyles )
	console.groupCollapsed.apply(console, args);
	log.newUserGroup();
};

log.wrap = function(fn){
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
xlog.wrap = function(fn){ return fn; }

log.wrapi = function(fn, name, argNames){
	return function(){
		return log.ret()
	};
};

log.newFunctionGroup = function(name, argNames){
	var functionGroup = {
		open: true,
		type: "function",
		close: function(){
			if (this.open){
				console.groupEnd();
				this.open = false;
			} else {
				console.warn("already closed!!");
			}
		},
		name: name,
		argNames: argNames
	};

	log.addGroup(functionGroup);
};


/* 
TODO
If log.wrapc (collapsed), and ret is undefined, 
	put the "return value" inside the group, or before the groupEnd() (keep it tidy)

If log.wrap (expanded), and ret is undefined, 
	put the "return value" inside the group, or before the groupEnd()
	if the ret value is undefined, we don't need to see it when we collapse the group

If ret is defined, put it outside the group
*/
log.ret = function(ret){
	if (is.def(ret)){
		console.groupEnd();
		console.log('%creturn', groupStyles + "margin-left: 6px", ret);
	} else {
		console.log('%creturn', groupStyles, ret);
		console.groupEnd();
	}
	return ret;
};

log.args = function(args, def){
	var bt = getBacktrace(), 
		trace = bt[3],
		name = def.name,
		argNames = def.argNames;

	// console.warn("log.args", args, name, argNames);
	// console.log("trace", trace);

	// console.log("currentFileGroup", log.currentFileGroup);
	log.fileGroup(trace);

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


	console.groupCollapsed.apply(console, label);
	log.newFunctionGroup(name, argNames);

	// if fn is defined elsewhere
	if (!log.currentFileGroup || (log.currentFileGroup && log.currentFileGroup.file !== def.file)){
		// console.warn("fake file group");
		console.log("%c"+def.file, groupStyles + "font-weight: bold");
		log.addGroup({
			type: "file",
			open: false,
			file: def.file,
			close: function(){
				console.warn("closing fake file/fn hybrid group");
			}
		});
	}

	return args;
};

log.trace = function(){
	var fullbt = getBacktrace(),
		bt = fullbt[3];

		console.log(fullbt);

	var trace = "%c" + bt.func;

	trace += "() [" + bt.file + ":" + bt.line + "]"; 
	// console.group(trace, "font-weight: normal");
	return trace;
};

wrappedGlobalFunction = log.wrap(function wrappedGlobalFunction(){
	log("wrappedGlobalFunction in log.js");
	globalFunction();
	log("calling myFunc in app.js");
	myFunc();
	log("fn ending");
});

globalFunction = xlog.wrap(function globalFunction(){
	log('globalFunction, from log.js');
	log("bt"); log(getBacktrace());
	log.group('a group inside globalFunction', 1234, function(){});
	log('whatup');
	log.end();
	log("back to root level of globalFunction");
});

globalFunction2 = function(){
	// log('globalFunction, from log.js');
	log.group('a group inside globalFunction', 1234, function(){});
	log('whatup');
	log('whatup');
	log('whatup');
	log.end();
};
})();

