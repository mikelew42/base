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

log = function(val){
	if (!log.log)
		return val;
	// console.log("+++++++++++================= new log =======================++++++++++++");
	new Log({
		arguments: arguments,
		trace: getBacktrace()[2]
	});
	// console.table(log.openGroups);
	// console.log("++++++++++++================ end new log ====================++++++++++++++\r\n \r\n ");

	return val; // always return 1st arg to be an "identity" fn 
};
log.log = true;
xlog = function(val){ return val; };

log.on = function(){
	log.log = true;
};

log.off = function(){
	log.log = false;
};

log.var = function(name, val){
	if (!log.log)
		return val;

	new Var({
		arguments: arguments,
		trace: getBacktrace()[2],
		name: name
	});

	return val;
};
xlog.var = function(name, val){ return val; };

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
	if (!log.log)
		return;

	if (log.currentGroup.type === "user"){
		log.currentGroup.close();
	} else if (log.currentGroup.type === "file"){ 
			// auto groups might happen within a user group.
			// other groups might remain open on accident
			// a better way to try and resolve this nesting might be in order.
		console.error("try closing twice?");
		log.currentGroup.close();
		log.currentGroup.close();
	}
};
xlog.end = noop;

log.openGroups = [];
log.currentFile = "";

log.add = function(group){
	log.openGroups.push(log.currentGroup);
	log.currentGroup = group;
	return group;
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
		var p = false, a = false, b = false;

		if (log.currentFile !== this.trace.file) {
			p = true;
			// console.log(true, "file mismatch, current file: ", log.currentFile, "!== new file:", this.trace.file);

			if (log.currentGroup.type == "file"){
				a = true;
				// console.log(true, "log.currentGroup.type == 'file'");
				// console.warn("log.currentGroup.close()");
				log.currentGroup.close();
			} else {
				// console.log(false, "current group is not a file group", "currentGroup.type:", log.currentGroup.type);
			}

			if (log.currentFile !== this.trace.file){
				b = true;
				// console.log(true, "file mismatch, current file: ", log.currentFile, "still !== new file:", this.trace.file);
				// console.log("adding auto FileGroup");
				log.add(new FileGroup({
					trace: this.trace,
					lastFile: log.currentFile
				}));
			} else {
				// console.log(false);
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
 *  VAR
 
Cleanup groups with timeout?
 */

	var Var = function Var(){
		this.assign.apply(this, arguments);
		this.initialize();
	};

	Var.prototype = Object.create(Log.prototype);

	Var.prototype.assign({
		args: function(){
			if (this._args){
				return this._args;
			} else {
				this.arguments = this.arguments || [];
				this._args = Array.prototype.slice.call(this.arguments, 1);
				this._args.unshift(this.name+":"); // todo: style this out
				this.customArgs();
				return this._args;
			}
		}
	});



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
				if (this === log.currentGroup){
					console.groupEnd();
					// console.log.apply(console, ['closed default group: '].concat(this.arguments));
					this.open = false;
					log.currentGroup = log.openGroups.pop();
				} else {
					console.warn("attempting to close incorrect group", this, log.currentGroup);
				}
			} else {
				console.warn("already closed user group", this.arguments);
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

	// must be closed!!
	/* NEH!  Allow the last arg of this fn to be an anonymous function, which will be a much
	more robust end of the group.  A separate startGroup and startGroupc could be used for times in which continuity
	cannot be maintained. */
	log.group = function(name){
		var ret;
		if (!log.log)
			return name;

		// console.log(" \r\n \r\n%c================= new group =======================", "color: #ff6600");
		ret = log.add(new Group({
			trace: getBacktrace()[2],
			type: "user",
			arguments: arguments
		}));
		// console.log("%c================= end group =======================\r\n \r\n ", "color: #ff6600");
		return ret;
	};
	xlog.group = noop;

	log.groupc = function(name){
		var ret;

		if (!log.log)
			return name;

		// console.log("%c================= new collapsed group =======================", "color: #ff6600");
		ret = log.add(new Group({
			trace: getBacktrace()[2], 
			type: "user",
			arguments: arguments,
			method: "groupCollapsed"
		}));
		// console.log("%c================= end collapsed group =======================\r\n \r\n ", "color: #ff6600");
		return ret;
	};
	xlog.groupc = noop;

	log.closeAll = function(){
		var groupCount = log.openGroups.length;
		for (var i = 0; i < groupCount; i++){
			log.currentGroup.close();
		}
	};


/* * * * * * * * * * *
 *  FILE GROUP

Make sure to pass lastFile (which should be log.currentFile)
 */

	var FileGroup = function FileGroup(){
		this.assign.apply(this, arguments);
		this.initialize();
	};

	FileGroup.prototype = Object.create(Group.prototype);

	FileGroup.prototype.assign({
		type: "file",
		initialize: function(){
			// console.log("%c================= new file group =======================", "color: #006622");
			log.currentFile = this.trace.file;
			// log.autoFileGroup(this.trace());
			this.log(this.args());

			var self = this;
			this.autoCloseTimeout = setTimeout(function(){
				self.close(1);
			}, 0);
			// console.log("%c================= end file group =======================\r\n \r\n ", "color: #006622");
		},
		customArgs: function(){
			this._args.unshift("%c"+ this.trace.file, groupStyles);
		},
		close: function(auto){
			if (this.open){
				if (this === log.currentGroup){
					console.groupEnd();
					// console.log('closed file group: ' + this.trace.file);
					log.currentFile = this.lastFile;
					this.open = false;
					log.currentGroup = log.openGroups.pop();

					clearTimeout(this.autoCloseTimeout);
				} else {
					console.warn("attempting to close incorrect group!", this, log.currentGroup);
				}
			} else {
				console.warn((auto ? "auto " : "") + "already closed file group: ", this.trace.file);
			}
		}
	});

	log.makeFileGroup = function(trace){
		log.add(new FileGroup({
			trace: trace,
			lastFile: log.currentFile
		}));
	};



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

 				!this.def.anonymous && this.autoFileGroup();
 				
 				if (this.def.anonymous){
 					if (!log.currentFile || (this.def.trace.file !== log.currentFile)){
 						log.add(new FileGroup({
 							trace: this.def.trace,
 							lastFile: log.currentFile
 						}));
 					}
 				}

 				this.log(this.args());
 				this.fileChangeLabel();
 			}

 		},
 		retLog: function(){
 			if (log.currentGroup !== this){
 				if (log.currentGroup.type === 'file')
 					log.currentGroup.close();
 				else
 					console.warn("group inconsistency");
 			}

 			if (is.def(this.returnValue)){
 				if (log.currentGroup === this)
 					log.currentGroup.close();
 				else
 					console.error("log.ret attempting to close non-function group", log.currentGroup);
 				// console.groupEnd();
 				console.log('%creturn', groupStyles + "margin-left: 6px", this.returnValue);
 			} else {
 				if (this.logUndefinedReturnValue)
 					console.log('%creturn', groupStyles, this.returnValue);
 				// console.groupEnd();
 				if (log.currentGroup === this)
 					log.currentGroup.close();
 				else
 					console.error("log.ret attempting to close non-function group", log.currentGroup);
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
 			if (!log.currentFile || (log.currentFile !== this.def.file)){
 				console.log("%c"+ this.def.file, groupStyles + "font-weight: bold");
 				log.currentFile = this.def.file;
 			}
 		},
 		args: function(){
 			var line;
 			if (this._args){
 				return this._args;
 			} else {
 				if (this.def.anonymous)
 					line = this.def.line;
 				else
 					line = this.trace.line;

 				// build the function call label
 				var label = [ "%c" + line, groupStyles, this.name + "(" ];

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
 				if (this === log.currentGroup){
	 				console.groupEnd();
	 				// console.log("closed fn group: ", this.name);
	 				this.open = false;
	 				
	 				if (this.def.anonymous)
	 					log.currentFile = this.def.file;
	 				else
	 					log.currentFile = this.trace.file;

 					log.currentGroup = log.openGroups.pop();
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
 				// console.log("%c================= fn wrapper called =======================", "color: purple");
 				var fnGroup = log.add(new FunctionGroup({
 					trace: getBacktrace()[2],
 					def: def,
 					arguments: arguments,
 					ctx: this
 				})), ret;
 				ret = fnGroup.evaluate();
 				// console.log("%c================= end fn wrapper call =======================\r\n \r\n ", "color: purple");
 				return ret;
 			};
 		}
 	});










log.wrap = function(fn){
	if (!log.log)
		return fn;
	var def = new FunctionDefinition({
		trace: getBacktrace()[2],
		fn: fn
	});
	return def.wrapper();
};
xlog.wrap = function(fn){ return fn; }

log.wrapx = function(fn){
	if (!log.log)
		return fn;
	var def = new FunctionDefinition({
		trace: getBacktrace()[2],
		fn: fn,
		expand: true
	});
	return def.wrapper();
}
xlog.wrapx = function(fn){ return fn;}

log.cb = function(cb){
	if (!log.log)
		return cb;
	var def = new FunctionDefinition({
		anonymous: true,
		trace: getBacktrace()[2],
		fn: cb
	});
	return def.wrapper();
};
xlog.cb = function(cb){ return cb; };

log.cbx = function(cb){
	if (!log.log)
		return cb;
	var def = new FunctionDefinition({
		anonymous: true,
		trace: getBacktrace()[2],
		fn: cb,
		expand: true
	});
	return def.wrapper();
};
xlog.cbx = function(cb){ return cb; };





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



wrappedGlobalFunction = log.wrap(function wrappedGlozzzzbalFunction(){
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
	log.group('a group inside globalFunction2', 1234, function(){});
	log('whatup');
	log('whatup');
	log('whatup');
	log.end();
};

globalFunction3 = log.wrap(function globalFunction3(){
	log('globalFunction3');
	utilsGlobalFunction();
	log('globalFunction3');
});


})();

