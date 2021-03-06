var gulp = require('gulp'),
	livereload = require('gulp-livereload'),
	open = require('open'),
	express = require('express'),
	port = parseInt(process.argv[2]) || 80,
	less = require('gulp-less'),
	path = require('path'),
	fs = require('fs'),
	glob = require('glob');  // not sure why this doesn't work

gulp.task('server', function(next){
	var server = express().use(express.static( __dirname + '/public' )).listen(port, next);
	var portStr = port == 80 ? '' : ':' + port;
	console.log('Serving ' + 'http://localhost' + portStr);
	open("http://localhost" + portStr, "chrome");
});

// gulp.task('less', function () {
//   return gulp.src('./less/**/*.less')
//     .pipe(less({
//       paths: [ path.join(__dirname, 'less', 'includes') ]
//     }))
//     .pipe(gulp.dest('./public/css'));
// });

gulp.task('default', ['server'], function(){
	var refresh = livereload();
	console.log('watching');

	gulp.watch(['public/**']).on('change', function(file){
		refresh.changed(file.path);
	});

	gulp.watch('public/**/*.less').on('change', function(file){
		console.log('less changedd', file);
		return gulp.src(file.path)
			.pipe(less({
				paths: [file.path]
			}))
			.pipe(gulp.dest(path.dirname(file.path)));
	});
});