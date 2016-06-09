;(function(){
	

$(function(){
	log.setLevel(0);

	console.group('yo');
	console.trace('test');
	log.trace('test');
	log.debug('test');
	log.info('test');
	log.warn('test');
	log.error('test');
	console.groupEnd();

	test = {
		log: console.log.bind(console),
		log2: function(){
			console.log.apply(console, arguments);
		}
	};

	test.log('yo');
	test.log2('yo');
});

})();