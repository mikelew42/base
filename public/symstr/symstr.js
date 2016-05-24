;(function(){
var is = utils.is, 
	copy = utils.copy,
	mod = utils.mod,
	sfn = utils.sfn;

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

CollItem = function CollItem(){
	Base.apply(this, arguments);
};
CollItem.prototype = Object.create(Base.prototype);
CollItem.prototype.assign({
	initialize: function(){
		this.install();
	},
	install: function(){
		if (this.name && this.coll){
			// defineProperty... 
		}
	},
	remove: function(){
		
	}
});

Coll = function Coll(){
	Base.apply(this, arguments);
};

Coll.prototype = Object.create(Base.prototype);

Coll.prototype.assign({
	items: [],
	append: function(name, value){
		var item;

		if (arguments.length == 1){
			value = name;
			name = undefined;
		}

		item = new CollItem({
			coll: this,
			value: value,
			name: name
		});

		this.items.push(item);

		return item;
	},
	remove: function(value){
		// remove based on index...
	}
});

SymStr = function SymStr(){
	Base.apply(this, arguments);
};

SymStr.prototype = Object.create(Base.prototype);

SymStr.prototype.assign({

});

})();