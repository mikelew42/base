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

var noop = function(){};

var bg = "background: #eee;";

log = function(){
	return log.log.apply(log, arguments);
};
xlog = function(val){ return val; };

log.lastFile = "";
log.log = function(val){
	var trace = getBacktrace()[3],
		args = Array.prototype.slice.call(arguments);

	log.fileGroup(trace);
	// console.group(log.trace(), "font-size: 12px; font-weight: normal");
	args.unshift('%c' + trace.line, "background: #eee; margin-left: -8px; padding: 3px 5px 1px; border-bottom: 1px solid #ddd");
	console.log.apply(console, args);
	// log.end();
	return val; // always return 1st arg to be an "identity" fn 
};

log.end = function(){
	// console.warn("log.end", log.currentGroup.type);

	log.closeCurrentGroup();
	// log.lastGroupType = log.lastGroupTypes.pop();
	// log.lastCloser.close();
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
log.closeCurrentUserGroup = function(){
	if (log.currentUserGroup){
		if (log.currentUserGroup.open)
			log.currentUserGroup.close();

	} else {
		console.warn("no current user group");
	}
	if (log.openUserGroups.length){

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

var group = {
	type: "user" || "file",
	open: true || false,
	close: function(){
		if (this.open){
			console.groupEnd();
			this.open = false;
		} else {
			console.warn("already closed!!");
		}
	}
}

var groupCloser = function(){
	var closer = {
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
	// setTimeout(function(){
	// 	closer.close();
	// }, 0);
	return closer;
};

log.newFileGroup = function(file){
	var fileGroup = {
		type: "file",
		file: file,
		open: true,
		close: group.close
	};

	log.addGroup(fileGroup);
};

log.lastGroupType = "root";

log.fileGroup = function(trace){
	var fileGroup;
	// if log comes from a different file
	if (!log.currentFileGroup || (log.currentFileGroup && log.currentFileGroup.file !== trace.file)){
		// and if current group type is file, 
		if (log.currentGroup.type == "file"){
			// console.warn("closing currentGroup.type == file");
			log.closeCurrentGroup();
		}
		
			// console.dir(log);
		if (!log.currentFileGroup || (log.currentFileGroup.file !== trace.file)){
			console.group("%c"+trace.file, "margin-left: -4px; background: #eee; border-bottom: 1px solid #bbb; padding: 0px 3px 1px;");
			log.newFileGroup(trace.file);
		}
	}
	// if (log.lastFile !== trace.file){

	// 	if (log.lastFileCloser && log.lastGroupType == 'file'){
	// 		console.log("closing file group");
	// 		log.lastGroupType = log.lastGroupTypes.pop();
	// 		console.log("lastGroupType", log.lastGroupType);
	// 		log.lastFileCloser.close();
	// 	}

	// 	console.group("%c"+trace.file, "margin-left: -4px; background: #eee; border-bottom: 1px solid #bbb; padding: 0px 3px 1px;");

		
	// 	log.lastFile = trace.file;
	// 	log.lastFileCloser = groupCloser();

	// 	// "Q-tip" pattern :D
	// 	log.lastGroupTypes.push(log.lastGroupType);
	// 	// console.log("adding current lastGroupType to lastGroupTypes: ", log.lastGroupType, "==>", log.lastGroupTypes);
	// 	log.lastGroupType = "file";
	// 	// console.log("lastGroupType", log.lastGroupType);
	// }
};

var groupStyles = 
	"margin-left: -8px; \
	padding: 3px 5px 1px; \
	border-bottom: 1px solid #ddd; \
	background: #eee;"

log.lastGroupTypes = [];

// must be closed!!
log.group = function(name){
	var trace = getBacktrace()[2],
		args = Array.prototype.slice.call(arguments);

	log.fileGroup(trace);
	args.unshift("%c" + trace.line, groupStyles )
	console.group.apply(console, args);
	log.newUserGroup();
		// log.lastCloser = groupCloser();


		// // "Q-tip" pattern :D
		// log.lastGroupTypes.push(log.lastGroupType);
		// // console.log("adding current lastGroupType to lastGroupTypes: ", log.lastGroupType, "==>", log.lastGroupTypes);
		// log.lastGroupType = "user";
		// // console.log("lastGroupType", log.lastGroupType);
};
xlog.group = noop;

log.groupc = function(){
	var trace = getBacktrace()[2],
		args = Array.prototype.slice.call(arguments);

	log.fileGroup(trace);
	args.unshift("%c" + trace.line, groupStyles )
	console.groupCollapsed.apply(console, args);
	log.newUserGroup();
		// log.lastCloser = groupCloser();

		// // "Q-tip" pattern :D
		// log.lastGroupTypes.push(log.lastGroupType);
		// // console.log("adding current lastGroupType to lastGroupTypes: ", log.lastGroupType, "==>", log.lastGroupTypes);
		// log.lastGroupType = "user";
		// // console.log("lastGroupType", log.lastGroupType);
};

log.wrap = function(fn, name, argNames){
		// console.log(getBacktrace());
		// console.trace();
	return function(){
		// console.log('backtrace', getBacktrace());
		return log.ret(fn.apply(this, log.args(arguments, name, argNames)));
	};
};
xlog.wrap = function(fn){ return fn; }

log.wrapi = function(fn, name, argNames){
	return function(){
		return log.ret()
	};
};

log.ret = function(ret){
	console.log('return', ret);
	console.groupEnd();
	return ret;
};

log.args = function(args, name, argNames){
	var label = [ name + "(" ];
	if (args.length){
		for (var i in args){
			if (argNames[i])
				label.push(argNames[i]+":");
			label.push(args[i]);
			if (i < args.length - 1){
				label.push(",");
			}
		}
	}
	label.push(")");


	console.group.apply(console, label);
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

globalFunction = function(){
	log('globalFunction, from log.js');
	log("bt"); log(getBacktrace());
	log.group('a group inside globalFunction', 1234, function(){});
	log('whatup');
	log.end();
	log("back to root level of globalFunction");
};

globalFunction2 = function(){
	// log('globalFunction, from log.js');
	log.group('a group inside globalFunction', 1234, function(){});
	log('whatup');
	log('whatup');
	log('whatup');
	log.end();
};
})();

