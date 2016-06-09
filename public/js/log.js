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
window.panel = document.createElement("div");
panel.innerHTML = "test";
panel.classList.add('panel');
Object.assign(panel.style, {
	position: 'fixed',
	right: 0,
	bottom: 0,
	width: "300px",
	background: "#aaa"
});
var ready = function(){
	document.body.appendChild(panel);
};

if (document.readyState != 'loading')
	ready();
else
	document.addEventListener('DOMContentLoaded', ready);

var Base = function Base(o){
	this.assign(o);
	this.initialize.apply(this, arguments);
};

Base.prototype.initialize = function(o, args){};

Base.prototype.assign = function(o){
	if (is.obj(o)){
		for (var i in o)
			this[i] = o[i];
	}
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

	new Log({
		arguments: arguments,
		trace: getBacktrace()[2]
	});
	return val; // always return 1st arg to be an "identity" fn 
};
log.log = true;
log.type = "logger";
xlog = function(val){ return val; };
xlog.type = "xlogger";
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

var styles = {
	margin: "margin-left: -2px;",
	padding: "padding: 3px 5px 2px;",
	border: "border-bottom: 1px solid #ddd;",
	background: "background: #eee;",
	line: "line-height: 16px;",
	indent: "12px"
}

var groupStyles = 
	styles.margin + 
	styles.padding + 
	styles.border + 
	styles.background + 
	styles.line;

log.end = function(){
	if (!log.log)
		return;

	if (log.currentGroup.type === "user"){
		log.currentGroup.close();
	} else if (log.currentGroup.type === "file"){ 
			// auto groups might happen within a user group.
			// other groups might remain open on accident
			// a better way to try and resolve this nesting might be in order.
		// console.error("try closing twice?");
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


log.returnToGroup = function(group){
	while ((log.currentGroup !== group) && (log.currentGroup.type !== "root")){
		log.currentGroup.close()
	}
	return log.currentGroup === group;
};


log.resetGroup = function(){
	log.currentGroup = log.openGroups.pop();
	log.resetCurrentFile();
};

log.resetCurrentFile = function(){
	if (log.currentGroup.type === "file"){
		log.currentFile = log.currentGroup.file;
		return true;
	}
	
	if (log.currentGroup.type === "root"){
		log.currentFile = "";
		return true;
	}

	for (var i = log.openGroups.length - 1; i >= 0; i--){
		if (log.openGroups[i].type === "root"){
			log.currentFile = "";
			return true;
		}

		if (log.openGroups[i].type === "file"){
			log.currentFile = log.openGroups[i].file;
			return true;
		}
	}

	console.error("error resetting file");
	return false;
};

var Styled = function(o){
	this.assign(o);
};
Styled.prototype = Object.create(Base.prototype);
Styled.prototype.assign({
	type: "styled",
	str: undefined, // str
	styles: undefined // str
});




/* * * * * * * * * * *
 *  LOG
 */

var Log = function Log(o){
	this.assign(o);
	this.initialize();
};

Log.prototype = Object.create(Base.prototype);

Log.prototype.assign({
	method: "log",
	afg: true,
	styled: [], // objects { str: "str", styles: "css: props;" }
	initialize: function(){
		this.autoFileGroup();
		this.resolveArgs();
		this.log();
	},
	autoFileGroup: function(){
		if (this.afg){
			if (log.currentFile !== this.trace.file) {
				if (log.currentGroup.type == "file")
					log.currentGroup.close();

				if (log.currentFile !== this.trace.file){
					log.add(new FileGroup({
						trace: this.trace,
						lastFile: log.currentFile
					}));
				}
			}
		} else {
			if (log.currentGroup.type == "file")
				log.currentGroup.close();
		}
	},
	resolveArgs: function(){
		this.arguments = this.arguments || [];
		this.args = Array.prototype.slice.call(this.arguments);
		this.customArgs();
	},
	// provide override point in args fn above
	customArgs: function(){
		this.args.unshift("%c" + this.trace.line, groupStyles);
	},
	log: function(args){
		console[this.method].apply(console, this.args);
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
		resolveArgs: function(){
			this.arguments = this.arguments || [];
			this.args = Array.prototype.slice.call(this.arguments, 1);
			this.args.unshift(this.name+":"); // todo: style this out
			this.customArgs();
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
		},
		customArgs: function(){
			var icon;
			if (this.icon)
				icon = this.icon;
			else 
				icon = this.trace.line;
			this.args.unshift("%c" + icon, groupStyles);
		},
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

	log.rgroup = function(name){
		var ret;
		if (!log.log)
			return name;

		ret = log.add(new Group({
			trace: getBacktrace()[2],
			type: "user",
			arguments: arguments,
			afg: false,
			method: "groupCollapsed",
			icon: "⚡"
		}));

		return ret;
	};

/* * * * * * * * * * *
 *  CLOSURE GROUP

Make sure to pass lastFile (which should be log.currentFile)
 */

	var ClosureGroup = function ClosureGroup(){
		this.assign.apply(this, arguments);
		this.initialize();
	};

	ClosureGroup.prototype = Object.create(Group.prototype);

	ClosureGroup.prototype.assign({
		type: "user",
		expand: true,
 		initialize: function(){
			this.autoFileGroup();
			this.resolveArgs();
			 if (!this.expand)
 				this.method = "groupCollapsed";
			this.log();
			log.add(this);
			this.execute();
			this.close();
 		},
 		execute: function(){
 			this.fn.call(this.this);
 		}
	});

	log.closureGroup = function(opts, fn){
		var o = {};
		if (is.str(opts)){
			o.name = opts;
		} else if (is.obj(opts)){
			o = opts;
		}

		opts.trace = getBacktrace()[2];
		opts.fn = fn;

		new ClosureGroup(opts);
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
			this.resolveArgs()
			this.log();

			var self = this;
			this.autoCloseTimeout = setTimeout(function(){
				self.close(1);
			}, 0);
			// console.log("%c================= end file group =======================\r\n \r\n ", "color: #006622");
		},
		customArgs: function(){
			this.args.unshift("%c📄 " +  this.trace.file, "padding: 3px 7px 2px; font-size: 13px; line-height: 18px;" + styles.border + styles.background);
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
					console.warn((auto ? "auto " : "" ) + "attempting to close incorrect group!", this, log.currentGroup);
				}
			} else {
				console.warn((auto ? "auto " : "") + "already closed file group: ", this.trace.file);
			}
		}
	});



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
 		initialize: function(){
			this.name = this.def.name;
			this.defFile = this.def.trace.file;
			this.argNames = this.def.argNames;

			if (!this.def.expand)
				this.method = "groupCollapsed";

			this.autoFileGroup();
			this.resolveArgs();
			this.log();
			this.fileChangeLabel();
 		},
 		retLog: function(){
 			if (!log.returnToGroup(this))
 				console.warn("group inconsistency");

 			if (is.def(this.returnValue)){
 				log.currentGroup.close();
 				console.log('%creturn', groupStyles + "margin-left: " + styles.indent, this.returnValue);
 			} else {
 				if (this.logUndefinedReturnValue)
 					console.log('%creturn', groupStyles, this.returnValue);
 				
 				log.currentGroup.close();
 			}
 			return this.returnValue;
 		},
 		execute: function(){
 			this.returnValue = this.def.fn.apply(this.ctx, this.arguments);
 			this.retLog();
 			return this.returnValue;
 		},
 		fileChangeLabel: function(){
 			// if fn is defined elsewhere, label the file change
 			if (log.currentFile !== this.def.file){
 				console.log("%c"+ this.def.file, groupStyles + "font-weight: bold");
 				log.currentFile = this.def.file;
 			}
 		},
 		resolveArgs: function(){
 			var line = this.trace.line;

			// build the function call label
			var label = [ "%c" + line, groupStyles, this.def.label + "(" ];

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
			this.args = label;
 		},
 		close: function(){
 			if (this.open){
 				if (this === log.currentGroup){
	 				console.groupEnd();
	 				// console.log("closed fn group: ", this.name);
	 				this.open = false;
	 				
	 				if (this.def.cb)
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
 			this.resolveArgs();
 		},
 		resolveArgs: function(){
 			if (is.str(this.arguments[0])){
 				this.label = this.arguments[0];
 				if (is.fn(this.arguments[1])){
 					this.fn = this.arguments[1];
 				}
 			} else if (is.fn(this.arguments[0])){
 				this.fn = this.arguments[0];
 				if (this.fn.name)
 					this.label = this.fn.name;
 			}

 			this.argNames = getParamNames(this.fn);

 			this.line = this.trace.line;
 			this.file = this.trace.file;
 		},
 		wrapper: function(){
 			var def = this;
 			return function wrapper(){
 				if (!log.log)
 					return def.fn.apply(this, arguments);
 				// console.log("%c================= fn wrapper called =======================", "color: purple");
 				var fnGroup = log.add(new FunctionGroup({
 					trace: getBacktrace()[2],
 					def: def,
 					arguments: arguments,
 					ctx: this
 				})), ret;
 				ret = fnGroup.execute();
 				// console.log("%c================= end fn wrapper call =======================\r\n \r\n ", "color: purple");
 				return ret;
 			};
 		}
 	});



 	var CBDefinition = function CBDefinition(){
 		this.assign.apply(this, arguments);
 		this.initialize();
 	};

 	CBDefinition.prototype = Object.create(FunctionDefinition.prototype);

 	CBDefinition.prototype.assign({
 		wrapper: function(){
 			var def = this;
 			return function(){
 				if (!log.log)
 					return def.fn.apply(this, arguments);
 				return log.add(new CBGroup({
 					trace: getBacktrace()[2],
 					afg: false,
 					def: def,
 					arguments: arguments,
 					ctx: this
 				})).execute();
 			};
 		}
 	});

 	var CBGroup = function CBGroup(){
 		this.assign.apply(this, arguments);
 		this.initialize();
 	};

 	CBGroup.prototype = Object.create(FunctionGroup.prototype);

 	CBGroup.prototype.assign({
 		type: "cb",
 		afg: false,
 		fileChangeLabel: function(){
 			// if fn is defined elsewhere, label the file change
 			// if (log.currentFile !== this.def.file){
 				console.log("%c📄 "+ this.def.file, groupStyles + "font-weight: bold");
 				log.currentFile = this.def.file;
 			// }
 		},
 		resolveArgs: function(){

			// build the function call label
			var label = [ "%c⚡", groupStyles, this.def.label + " (" ];

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
			this.args = label;
 		},
 		close: function(){
 			var nearestFileGroup, n;
 			if (this.open){
 				if (this === log.currentGroup){
	 				console.groupEnd();
	 				// console.log("closed fn group: ", this.name);
	 				this.open = false;
 					log.resetGroup();
 				} else {
 					console.warn("attempting to close incorrect group");
 				}
 			} else {
 				console.warn("already closed, fn group: ", this.name);
 			}
 		}
 	});









log.wrap = function(fn){
	if (!log.log){
		if (!is.fn(arguments[0]) && is.fn(arguments[1]))
			return arguments[1];
		return fn;
	}
	var def = new FunctionDefinition({
		trace: getBacktrace()[2],
		fn: fn,
		arguments: arguments,
		expand: true
	});
	return def.wrapper();
};
xlog.wrap = function(fn){ return fn; }

log.wrapc = function(fn){
	if (!log.log){
		if (!is.fn(arguments[0]) && is.fn(arguments[1]))
			return arguments[1];
		return fn;
	}
	var def = new FunctionDefinition({
		trace: getBacktrace()[2],
		fn: fn,
		arguments: arguments
	});
	return def.wrapper();
}
xlog.wrapc = function(fn){ return fn;}

log.cb = function(cb){
	if (!log.log){
		if (!is.fn(arguments[0]) && is.fn(arguments[1]))
			return arguments[1];
		return cb;
	}
	var def = new CBDefinition({
		cb: true,
		trace: getBacktrace()[2],
		fn: cb,
		arguments: arguments,
		expand: true
	});
	return def.wrapper();
};
xlog.cb = function(cb){
	if (!is.fn(arguments[0]) && is.fn(arguments[1]))
		return arguments[1];
	return cb;
};

log.cbc = function(cb){
	if (!log.log){
		if (!is.fn(arguments[0]) && is.fn(arguments[1]))
			return arguments[1];
		return cb;
	}
	var def = new CBDefinition({
		cb: true,
		trace: getBacktrace()[2],
		fn: cb,
		arguments: arguments
	});
	return def.wrapper();
};
xlog.cbc = function(cb){ 
	if (!is.fn(arguments[0]) && is.fn(arguments[1]))
		return arguments[1];
	return cb;
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



wrappedGlobalFunction = log.wrapc(function wrappedGlozzzzbalFunction(){
	log("wrappedGlobalFunction in log.js");
	globalFunction();
	log("calling myFunc in app.js");
	myFunc();
	log("fn ending");
});

globalFunction = xlog.wrapc(function globalFunction(){
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

globalFunction3 = log.wrapc(function globalFunction3(){
	log('globalFunction3');
	utilsGlobalFunction();
	log('globalFunction3');
});

/* 

log.config({}) // basically, the smart extend
 - smart deep extend
 - deep extend objects, but type check base.value and ext.value
 - call functions with arguments


1) you have the parent scope's logger

log.wrap({config}, function(){  2) you clone the parent scope's logger with this config
	var log = log.clone({config});  3) you clone the parent scope's logger, and add this config

!!! Now you need to reconcile.  Somehow, you want parent --> wrap --> internal
Maybe, there's a way to let the wrap listen for sub logs, and pre-configure them
Wouldn't the only way to do that, be to diff the parent and internal, in order to figure out
whether it should override?
Unless we store the internal config, and then remake the internal logger with 
	parent --> wrap --> internal

}); 

*/

})();

