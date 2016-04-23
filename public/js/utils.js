;(function(){

var utils = window.utils = window.utils || {};

log('this is utils.js');
log('this is utils.js');
log(123);
log(true);
log({one: 1, two: "two", three: true, four: function(){} }, "hello", 123)

/*****************
	CLICK OFF
******************/
if (jQuery){
	jQuery.fn.clickOff = function(cb){
		this.each(function(){
			var $self = this;
			jQuery(document).click(function(e){
				if (!jQuery(e.target).closest($self).length)
					cb();
			});
		});
	};
}




/***********
	IS
************/
var is = utils.is = {
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




/************
	COPY
*************/
var getBase = function(value){
	return (value.Base && value.Base()) || 
			(is.obj(value) && {}) || 
			(is.arr(value) && []);
};

var returnable = function(value){
	return !is.def(value) || is.val(value) || (is.fn(value) && !value.Base);
};

var copy = utils.copy = function(value, base, ctx){
								// this is necessary to maintain ctx arg
	if(value && value.copy && value.copy !== copy.oo)
		return value.copy();

	if (returnable(value))
		return value;
	
	base = base || getBase(value);

	for (var i in value){
		if (value[i] === ctx || i[0] === "$")
			continue;
		base[i] = copy(value[i], null, value);
	}

	return base;
};

utils.copy.oo = function(){
	return copy(this);
};

utils.copyTo = function(base){
	return copy(this, base);
};




/************
	MOD
*************/
var mod = utils.mod = { 
	copy: copy.oo,
	copyTo: utils.copyTo,
	assign: function(obj){
		if (is.obj(obj)){
			for (var i in obj)
				this[i] = obj[i];
		}
		return this;
	},
	install: function(m){
		m.copyTo(this);
		return this;
	},
	clone: function(p){
		var c = this.copy().assign(p);
		if (c.init) c.init.apply(c, arguments);
		return c;
	},
	/* note: if assign is put inside init, then you can't add init 
	and have it run immediately, which is kinda nice */
	create: function(p){
		var c = this.copy();
		if (c.init) c.init.apply(c, arguments);
		return c;
	}
};



/************
	SFN
*************/
var sfn = utils.sfn = function(){
	var arg, fn = function(){
		return fn.main.apply(fn, arguments);
	};

	copy(mod, fn);

	fn.main = function(){};

	if(arguments.length){
		for(var i=0; i<arguments.length; i++){
			arg = arguments[i];
			if (typeof arg === "object")
				fn.assign(arg);
			else if (typeof arg === "function")
				fn.main = arg;
		}
	}

	fn.Base = sfn;
	
	return fn;
};



/***********
	GETSET
	**********/

var GetSet = utils.GetSet = sfn(function(){
	if (arguments.length){
		return this.set.apply(this, arguments);
	} else {
		return this.get.call(this);
	}
}, {
	// get and set fns must be defined!
	get: function(){
		console.log('the get method has not been redefined!');
	},
	set: function(){
		console.log('the set method has not been redefined!');
	}
});



/* log */



})();