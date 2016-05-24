// log2.js
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
// console.log(backtrace);
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

log2 = function(val){
	new Log({
		arguments: arguments,
		trace: getBacktrace()[2]
	});

	return val; // always return 1st arg to be an "identity" fn 
};
xlog2 = function(val){ return val; };

/* TODO
This needs to be coordinated with other margins, but the indentation value
could be dramatically changed for better grouping clarity.  Maybe its a function of depth, so
as depth increases, the indentation decreases, to avoid running off the page. */
var groupStyles = 
	"margin-left: -8px; \
	padding: 3px 5px 2px; \
	border-bottom: 1px solid #ddd; \
	background: #eee; \
	line-height: 16px; \
	color: orange;";

log2.end = function(){
	log2.currentGroup.close();
};
xlog2.end = noop;

log2.openGroups = [];
log2.currentFile = "";
log2.addGroup = function(group){
	log2.openGroups.push(log2.currentGroup);
	log2.currentGroup = group;
};

log2.add = function(group){
	log2.openGroups.push(log2.currentGroup);
	log2.currentGroup = group;
	return group;
};

log2.closeCurrentGroup = function(){
	// console.log("log2.closeCurrentGroup", log2.currentGroup);
	if (log2.currentGroup.type !== "root" && log2.openGroups.length){
		log2.currentGroup.close();
		log2.currentGroup = log2.openGroups.pop();
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
		if (log2.currentFile !== this.trace.file) {
			if (log2.currentGroup.type == "file"){
				log2.currentGroup.close();
			}

			if (log2.currentFile !== this.trace.file){
				log2.add(new FileGroup({
					trace: this.trace,
					lastFile: log2.currentFile
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
				if (this === log2.currentGroup){
					console.groupEnd();
					console.log.apply(console, ['closed default group: '].concat(this.arguments));
					this.open = false;
					log2.currentGroup = log2.openGroups.pop();
				} else {
					console.warn("attempting to close incorrect group", this, log2.currentGroup);
				}
			} else {
				console.warn("already closed user group", this.arguments);
			}
		}
	});

	log2.currentGroup = new Group({
		type: "root",
		initialize: function(){},
		open: true,
		close: function(){
			console.warn("can't close root group");
		}
	});

	// must be closed!!
	/* NEH!  Allow the last arg of this fn to be an anonymous function, which will be a much
	more robust end of the group.  A separate startGroup and startGroupc could be used for times in which continuity
	cannot be maintained. */
	log2.group = function(name){
		return log2.add(new Group({
			trace: getBacktrace()[2],
			type: "user",
			arguments: arguments
		}));
	};
	xlog2.group = noop;

	log2.groupc = function(){
		return log2.add(new Group({
			trace: getBacktrace()[2], 
			type: "user",
			arguments: arguments,
			method: "groupCollapsed"
		}));
	};
	xlog2.groupc = noop;

	log2.closeAll = function(){
		var groupCount = log2.openGroups.length;
		for (var i = 0; i < groupCount; i++){
			log2.currentGroup.close();
		}
	};


/* * * * * * * * * * *
 *  FILE GROUP

Make sure to pass lastFile (which should be log2.currentFile)
 */

	var FileGroup = function FileGroup(){
		this.assign.apply(this, arguments);
		this.initialize();
	};

	FileGroup.prototype = Object.create(Group.prototype);

	FileGroup.prototype.assign({
		type: "file",
		initialize: function(){
			log2.currentFile = this.trace.file;
			// log2.autoFileGroup(this.trace());
			this.log(this.args());

			var self = this;
			setTimeout(function(){
				self.close(1);
			}, 0);
		},
		customArgs: function(){
			this._args.unshift("%c"+ this.trace.file, groupStyles);
		},
		close: function(auto){
			if (this.open){
				if (this === log2.currentGroup){
					console.groupEnd();
					console.log('closed file group: ' + this.trace.file);
					log2.currentFile = this.lastFile;
					this.open = false;
					log2.currentGroup = log2.openGroups.pop();
				} else {
					console.warn("attempting to close incorrect group!", this, log2.currentGroup);
				}
			} else {
				console.warn((auto ? "auto " : "") + "already closed file group: ", this.trace.file);
			}
		}
	});

	log2.makeFileGroup = function(trace){
		log2.add(new FileGroup({
			trace: trace,
			lastFile: log2.currentFile
		}));
	};

	// log2.autoFileGroup = function(trace){
	// 	if (!log2.currentFile){
	// 		log2.makeFileGroup(trace);
	// 	} else if (log2.currentFile !== trace.file) {
	// 		if (log2.currentGroup.type == "file"){
	// 			log2.closeCurrentGroup();
	// 		}

	// 		if (log2.currentFile !== trace.file){
	// 			log2.makeFileGroup(trace);
	// 		}
	// 	}
	// };



/* * * * * * * * * * *
 *  FUNCTION GROUP

Blah
 */

 	var FunctionGroup = function FunctionGroup(){
 		this.assign.apply(this, arguments);
 		this.initialize();
 	};

 	FunctionGroup.prototype = Object.create(Group.prototype);

 	FunctionGroup.prototype.assign({
 		type: "function",
 		afg: true,
 		initialize: function(){
 			// temp
	 		if (true){
	 			this.name = this.def.name;
	 			this.defFile = this.def.trace.file;
	 			this.argNames = this.def.argNames;

	 			if (!this.def.expand)
	 				this.method = "groupCollapsed";

 				this.afg && this.autoFileGroup();
 				this.log(this.args());
 				this.fileChangeLabel();
 			}

 		},
 		retLog: function(){
 			if (is.def(this.returnValue)){
 				if (log2.currentGroup.type == "function")
 					log2.currentGroup.close();
 				else
 					console.error("log2.ret attempting to close non-function group", log2.currentGroup);
 				// console.groupEnd();
 				console.log('%creturn', groupStyles + "margin-left: 6px", this.returnValue);
 			} else {
 				console.log('%creturn', groupStyles, this.returnValue);
 				// console.groupEnd();
 				if (log2.currentGroup.type == "function")
 					log2.currentGroup.close();
 				else
 					console.error("log2.ret attempting to close non-function group", log2.currentGroup);
 			}
 			return this.returnValue;
 		},
 		evaluate: function(){
 			this.returnValue = this.def.fn.apply(this.ctx, this.arguments);
 			this.retLog();
 			return this.returnValue;
 		},
 		fileChangeLabel: function(){
 			// if fn is defined elsewhere, label the file change
 			if (!log2.currentFile || (log2.currentFile !== this.def.file)){
 				console.log("%c"+ this.def.file, groupStyles + "font-weight: bold");
 				log2.currentFile = this.def.file;
 			}
 		},
 		args: function(){
 			if (this._args){
 				return this._args;
 			} else {
 				// build the function call label
 				var label = [ "%c" + this.trace.line, groupStyles, this.name + "(" ];

 				if (this.argNames.length){
 					for (var i = 0; i < this.argNames.length; i++){
 						if (this.argNames[i])
 							label.push(this.argNames[i]+":");
 						label.push(this.arguments[i]);
 						if (i < this.argNames.length - 1){
 							label.push(",");
 						}
 					}
 				}
 				label.push(")");
 				this._args = label;
 				return this._args;
 			}
 		},
 		close: function(){
 			if (this.open){
 				if (this === log2.currentGroup){
	 				console.groupEnd();
	 				console.log("closed fn group: ", this.name);
	 				this.open = false;
	 				log2.currentFile = this.trace.file;
 					log2.currentGroup = log2.openGroups.pop();
 				} else {
 					console.warn("attempting to close incorrect group");
 				}
 			} else {
 				console.warn("already closed, fn group: ", this.name);
 			}
 		}
 	});


 	var FunctionDefinition = function FunctionDefinition(){
 		this.assign.apply(this, arguments);
 		this.initialize();
 	};

 	FunctionDefinition.prototype = Object.create(Base.prototype);

 	FunctionDefinition.prototype.assign({
 		initialize: function(){
 			this.name = this.fn.name;
 			this.argNames = getParamNames(this.fn);

 			// temp
 			this.line = this.trace.line;
 			this.file = this.trace.file;
 		},
 		wrapper: function(){
 			var def = this;
 			return function wrapper(){
 				var fnGroup = log2.add(new FunctionGroup({
 					trace: getBacktrace()[2],
 					def: def,
 					arguments: arguments,
 					ctx: this
 				}));
 				return fnGroup.evaluate();
 			};
 		}
 	});

log2.wrap = function(fn){
	var def = new FunctionDefinition({
		trace: getBacktrace()[2],
		fn: fn
	});
	return def.wrapper();
};
xlog2.wrap = function(fn){ return fn; }

log2.wrapx = function(fn){
	var def = new FunctionDefinition({
		trace: getBacktrace()[2],
		fn: fn,
		expand: true
	});
	return def.wrapper();
}
xlog2.wrapx = function(fn){ return fn;}



})();

