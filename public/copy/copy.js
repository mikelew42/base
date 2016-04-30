;(function(utils){
var is = utils.is;

;(function(is){
// copy1



var copy1 = utils.copy1 = log.wrap(function copy1(value, base){
	var ret;
	
	if (value && value.copy){
		ret = value.copy();
	} else {
		// log && console.log('std copy (no OO value.copy)');
		ret = std(value, base);
	}
	return ret;
});

var getBase = copy1.getBase = function(value){
	return (is.obj(value) && {}) || 
			(is.arr(value) && []);
};

var returnable = copy1.returnable = function(value){
	return !is.def(value) || is.val(value) || is.fn(value);
};

var std = copy1.std = function(value, base){
	if (returnable(value)){
		return value;
	}

	if (base){
		log && console.log('using provided base: ', base);
	} else {
		base = getBase(value);
		// log && console.log('using new base: ', base);
	}

	return iterate(value, base);
};

var simpleIterate = function(value, base){
	// log && console.log('iterate:');
	for (var i in value){
		log && console.group(i);
		base[i] = copy1(value[i]);
		log && console.groupEnd();
	}
	return base;
};

var iterate = copy1.iterate = function(value, base){

	var propsKeys = Object.keys(value.props || {});
	log && console.log('propsKeys', propsKeys);

	for (var i in value){
		if (i[0] === "$"){
			log && console.log('$kipping ' + i);
			continue;
		}
		if (propsKeys.indexOf(i) > -1){
			log && console.log('skipping propsKey ' + i);
			continue;
		}
		
		log(i);
		base[i] = copy1(value[i])
	}

	if (base.props){
		log && console.group('base.props');

		for (var i in base.props){
			log && console.group(i);

			if (is.str(base.props[i])){
				switch(base.props[i]){
					case 'reassign':
						log && console.log('reassign');
						base[i] = value[i];
						break;
					case 'dnc':
						log && console.log('dnc');
						break;
					case "copy":
						log && console.log('copy');
					default:
						base[i] = copy1(value[i]);
						break;
				}
			} else if (base.props[i].defineOnto){
				log && console.log('base.props[' + i + '].defineOnto');
				base.props[i].defineOnto(base);
				base.props[i].mod = base;		
			}

			log && console.groupEnd();
		}

		log && console.groupEnd();
	}

	return base;
};

utils.copy1.oo = function(){
	var ret, lastLog = log;
	log = this.shouldLog();
	log && console.groupCollapsed('copying ' + this.type);
	ret = copy1.std(this);
	log && console.groupEnd();
	log = lastLog;
	return ret;
};

utils.copy1.to = function(base){
	return copy1.std(this, base);
};

})(is);


})(utils);