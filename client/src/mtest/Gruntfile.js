module.exports = function(grunt) {

	// Project configuration.
	grunt
			.initConfig({
				pkg : grunt.file.readJSON('package.json'),
				uglify : {
					options : {
						banner : '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
					},
					build : {
						src : 'js/akorp.js',
						dest : 'js/akorp.js'
					}
				},
				requirejs : {
					compile : {
						options : {
							appDir : ".",
							baseUrl : "js",
							dir : "../akorp-build",
							modules : [ {
								name : "akorp"
							} ],
							stubModules : [ 'text' ],
							optimize : "uglify",
							//optimizeAllPluginResources : true,
							findNestedDependencies : true,
							removeCombined : true,
							skipDirOptimize : true,
							mainConfigFile : "js/requireConfig.js",

							paths : {
								"plugins" : "lib",
								"bootstrap" : "lib/bootstrap.min",
								"jquery" : "lib/jquery",
								"underscore" : "lib/underscore-min",
								"backbone" : "lib/backbone-min",
								"text" : "lib/text",
								"akputils" : "modules/akputils",
								"featureCheck" : "modules/featureCheck",
								"socketModule" : "modules/socketModule",
								"akpMain" : "modules/akpMain",
								"akpauth" : "modules/akpauth",
								"akpkons" : "modules/akpkons",
								"akpvault" : "modules/akpvault",
								"akprtc" : "modules/akprtc",
								"akpmedia" : "modules/akpmedia",
								"akpplanner" : "modules/akpplanner",
								"akpTour" : "modules/akpTour",
								"appViews" : "modules/appViews",
								"akpcontacts" : "modules/akpcontacts",
								"akpGroups" : "modules/akpGroups",
								"akpUsers" : "modules/akpUsers",
								"picUpdater" : "modules/picUpdater",
								"akpprofiles" : "modules/akpprofiles",
								"pdfOpener" : "modules/pdfOpener",
								"feedback" : "modules/feedback",
								"wsGet" : "modules/wsGet",
							},
						}
					}
				}
			});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');

	// Default task(s).
	grunt.registerTask('default', [ 'requirejs' ]);

};
