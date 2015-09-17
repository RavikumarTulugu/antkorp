/**
 * @author Rajukonga
 */
requirejs.config({
	baseUrl : 'js/modules',
	waitSeconds : 200,
	shim : {

		underscore : {
			exports : "_"
		},
		backbone : {
			deps : [ 'underscore', 'jquery' ],
			exports : 'Backbone'
		},

	},
	paths : {
		plugins : "../lib",	
		jquery : "../../assets/jquery/jquery.min",
		underscore : "../../assets/underscore/underscore-min",
		backbone : "../../assets/backbone/backbone-min",
		text : "../../assets/requirejs-text/text",
		
		bootstrap : "../lib/bootstrap.min",
		jcrop:'../../assets/jcrop/js',
		jqueryui : "../../assets/jquery-ui/ui/minified/jquery-ui.min",
		fullcalendar:'../../assets/fullcalendar/fullcalendar.min',
		'jquery.tagsinput':'../../assets/jquery.tagsinput/jquery.tagsinput.min',
		'jquery-tmpl':'../../assets/jquery-tmpl/jquery.tmpl.min',		
	},

});