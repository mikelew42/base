;(function(){
var is = utils.is, 
	copy = utils.copy1,
	logThisFile = 0;

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

var module = utils.module = {
	logThisObj: logThisFile,
	logIsFrozen: 0,
	freezeLog: function(){
		this.logIsFrozen = this.shouldLog() ? 1 : -1;
	},
	unfreezeLog: function(){
		this.logIsFrozen = 0;
	},
	shouldLog: function(){
		var absFile = Math.abs(logThisFile),
			absObj = Math.abs(this.logThisObj);

		if (this.logIsFrozen !== 0)
			return this.logIsFrozen > 0; 

		if (absFile > absObj){
			if (logThisFile > 0)
				return true;
			else
				return false
		} else {
			if (this.logThisObj > 0)
				return true;
			else
				return false;
		}

	},
	log: function(val){
		if (!this.shouldLog())
			return val;

		this.logTrace();
		console.log.apply(console, arguments);
		this.logEnd();
		return val;
	},
	logG: function(val){
		if (!this.shouldLog())
			return val;

		this.logTrace();
		console.group.apply(console, arguments);
		this.logEnd();
		return val;
	},
	logG_noTrace: function(val){
		if (!this.shouldLog())
			return val;

		console.group.apply(console, arguments);
		return val;
	},
	logg: function(val){
		if (!this.shouldLog())
			return val;

		this.logTrace();
		console.groupCollapsed.apply(console, arguments);
		this.logEnd();
		return val;
	},
	logTrace: function(){
		var fullbt = getBacktrace(),
			bt = fullbt[3];

		var trace = bt.func.replace('Object.utils.', '');

		trace += "() [" + bt.file + ":" + bt.line + "]"; 
		console.group(trace);
	},
	// usage:  return this.logEnd(someFn(args)  /*this is grouped, and returned*/ );
	logEnd: function(val){
		if (!this.shouldLog())
			return val;

		if (arguments.length){
			this.log.apply(this, arguments);
		}

		console.groupEnd();

		return val;
	},
	logWrap: function(fn){
		return function(){
			return this.logRet(this.logFn(fn, this.logArgs(arguments)));
		};
	},
	type: "module",
	copy: copy.oo,
	copyTo: copy.to,
	props: {},
	prop: function(name, value){
		if (this.props[name] && this.props[name].defineOnto){
			if (is.def(value)){
				this[name] = value;
			}

			return this.props[name];
		}
		var p = Property.clone({
			name: name,
			log: this.log
		});

		p.defineOnto(this);

		this[name] = value;

		return p;
	},
	assign: function(obj){
		this.freezeLog();
		if (is.obj(obj)){
			this.logg('assigning', obj);
			for (var i in obj)
				this[i] = obj[i];
			this.logEnd();
		}
		this.unfreezeLog();
		return this;
	},
	install: function(m){
		m.copyTo(this);
		return this;
	},
	clone: function(p){
		var destType = p && p.type ? '--> ' + p.type : this.type;
		this.logg('cloning', this.type, destType);
		var c = this.copy().assign(p);
		if (c.init) c.init.apply(c, arguments);
		this.logEnd();
		return c;
	}
};

var Property = utils.Property = module.clone({
	type: "property",
	name: 'unnamedProperty',
	value: undefined,
	props: {
		mod: "dnc"
	},
	getter: function(){
		this.log && console.log("." + this.name, this.value);
		return this.value || this;
	},
	setter: function(value){
		if (value && value.defineOnto)
			value.defineOnto(this.mod); // essentially, replace the whole Property object
		else 
			this.set(value); 
	},
	defineOnto: function(mod){
		this.log && console.log('installing property', this.name);
		var prop = this, name = this.name;
		this.mod = mod;
		mod.props = mod.props || {};
		mod.props[name] = this;
		Object.defineProperty(mod, name, {
			get: function(){
				// console.log('mod.' + name + ' get');
				return this.props[name].getter();
			},
			set: function(value){
				return this.props[name].setter(value);
			},
			configurable: true,
			enumerable: true
		});
		return this;
	},
	set: function(value){
		this.log && console.log('.' + this.name + ' set', value);
		// different for value objects, views, etc.
		if (value !== this.value)
			this.change(value);
		return this;
	},
	change: function(value){
		this.log && console.log('.' + this.name + ' change', value);
		this.value = value;
		return this; // probably not necessary... when would you chain on the prop obj?
			// also, this should be an auto q, not a normal upgraded fn.
	}
}); 

var module2 = utils.module2 = module.clone({
	type: "module2",
	assign: function(obj){
		var log = this.log;
		if (is.obj(obj)){
			log && console.groupCollapsed('assigning', obj);
			for (var i in obj){
				if (is.fn(obj[i])){
					// upgrade as super fn? until then...
					this[i] = obj[i];
				} else {
					log && console.groupCollapsed('auto-upgrading .'+i);
					this.prop(i, obj[i]);
					log && console.groupEnd();
				}
			}
			log && console.groupEnd();
		}
		return this;
	}
});

})();