'use strict';

module.exports = function(grunt) {

    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);
    
	// Project configuration.
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		yeoman : {
            app : 'app',
            dist : 'dist'
        },
        jshint : {
            options : {
                jshintrc : '.jshintrc',
                reporter : require('jshint-stylish')
            },
            all : [ 'Gruntfile.js',
                    //'<%= yeoman.app %>/js/modules/{,*/}*.js',
                    ]
        },
        compass : {
            options : {
                sassDir : '<%= yeoman.app %>/css',
                cssDir : '.tmp/css',
                generatedImagesDir : '.tmp/css/images/generated',
                imagesDir : '<%= yeoman.app %>/css/images',
                javascriptsDir : '<%= yeoman.app %>/js',
                fontsDir : '<%= yeoman.app %>/css/fonts',
                importPath : '<%= yeoman.app %>/assets',
                httpImagesPath : '/css/images',
                httpGeneratedImagesPath : '/css/images/generated',
                httpFontsPath : '/css/fonts',
                relativeAssets : false,
                assetCacheBuster : false
            },
            dist : {
                options : {
                    generatedImagesDir : '<%= yeoman.dist %>/images/generated'
                }
            },
            server : {
                options : {
                    debugInfo : true
                }
            }
        },

        clean : {
            dist : {
                files : [ {
                    dot : true,
                    src : [ '.tmp', '<%= yeoman.dist %>/*',
                            '!<%= yeoman.dist %>/.git*' ]
                } ]
            },
            server : '.tmp'
        },
        useminPrepare : {
            options : {
                dest : '<%= yeoman.dist %>'
            },
            html : '<%= yeoman.app %>/index.html'
        },
        usemin : {
            options : {
                assetsDirs : [ '<%= yeoman.dist %>' ]
            },
            html : [ '<%= yeoman.dist %>/{,*/}*.html' ],
            css : [ '<%= yeoman.dist %>/css/{,*/}*.css' ]
        },
        imagemin : {
            dist : {
                files : [ {
                    expand : true,
                    cwd : '<%= yeoman.app %>/css/images',
                    src : '{,*/}*.{gif,jpeg,jpg,png}',
                    dest : '<%= yeoman.dist %>/css/images'
                } ]
            }
        },
        svgmin : {
            dist : {
                files : [ {
                    expand : true,
                    cwd : '<%= yeoman.app %>/css/images',
                    src : '{,*/}*.svg',
                    dest : '<%= yeoman.dist %>/css/images'
                } ]
            }
        },
        cssmin : {
        // This task is pre-configured if you do not wish to use Usemin
        // blocks for your CSS. By default, the Usemin block from your
        // `index.html` will take care of minification, e.g.
        //
        // <!-- build:css({.tmp,app}) styles/main.css -->
        //
         dist: {
            files:[ {
                dest:'<%= yeoman.dist %>/css/viewer.css',
                src: ['<%= yeoman.app %>/css/viewer.css' ]
                }]
            }
        },
        htmlmin : {
            dist : {
                options : {
                /*
                 * removeCommentsFromCDATA: true, //
                 * https://github.com/yeoman/grunt-usemin/issues/44
                 * //collapseWhitespace: true,
                 * collapseBooleanAttributes: true,
                 * removeAttributeQuotes: true,
                 * removeRedundantAttributes: true, useShortDoctype:
                 * true, removeEmptyAttributes: true,
                 * removeOptionalTags: true
                 */
                },
                files : [ {
                    expand : true,
                    cwd : '<%= yeoman.app %>',
                    src : '*.html',
                    dest : '<%= yeoman.dist %>'
                } ]
            }
        },
		uglify : {
			options : {
				banner : '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				preserveComments:'all',
				compress:{
                    pure_funcs: [ 'console.log' ],
                    
                }
			},
			dist : {
				src : '.tmp/js/akorp.js',
				dest : '<%= yeoman.dist %>/js/akorp.js'
			}
		},
		concat : {
	            options : {
	                seperator : ';',
	            },
	            dist : {
	                    dest:'.tmp/js/akorp.js',
	                    src : [
	                        //'<%= yeoman.app %>/js/config.js',
	                           //'<%= yeoman.app %>/js/main.js',
	                        '<%= yeoman.app %>/js/akorp.js',
	                        '<%= yeoman.app %>/js/modules/akputils.js',
	                        '<%= yeoman.app %>/js/modules/featureCheck.js',
	                        '<%= yeoman.app %>/js/modules/akpMain.js',
	                        '<%= yeoman.app %>/js/modules/akpauth.js',
	                        '<%= yeoman.app %>/js/modules/akpkons.js',
	                        '<%= yeoman.app %>/js/modules/akpvault.js',
	                        '<%= yeoman.app %>/js/modules/akprtc.js',
	                        '<%= yeoman.app %>/js/modules/akpmedia.js',
	                        '<%= yeoman.app %>/js/modules/akpplanner.js',
	                        '<%= yeoman.app %>/js/modules/akpTour.js',
	                        '<%= yeoman.app %>/js/modules/appViews.js',
	                        '<%= yeoman.app %>/js/modules/akpcontacts.js',
	                        '<%= yeoman.app %>/js/modules/akpGroups.js',
	                        '<%= yeoman.app %>/js/modules/akpUsers.js',
	                        '<%= yeoman.app %>/js/modules/picUpdater.js',
	                        '<%= yeoman.app %>/js/modules/akpprofiles.js',
	                        '<%= yeoman.app %>/js/modules/pdfOpener.js',
	                        '<%= yeoman.app %>/js/modules/feedback.js',
	                        '<%= yeoman.app %>/js/modules/socketModule.js',
	                        '<%= yeoman.app %>/js/modules/uploader.js',
	                        
	                           //'<%= yeoman.app %>/js/modules/wsGet.js',
	                    ],
	                    nonull:true,
	                }
	            },
                copy : {
                    dist : {
                        files : [ {
                            expand : true,
                            dot : true,
                            cwd : '<%= yeoman.app %>',
                            dest : '<%= yeoman.dist %>',
                            src : [
                                    '*.{ico,png,txt,js}',
                                    '.htaccess',
                                    'css/images/{,*/}*.{webp,gif,jpg,jpeg,gif,png} ',
                                    'css/fonts/{,*/}*.*',
                                    'css/lato/{,*/}*.*',
                                    
                                    //'css/jquery-ui-1.10.1.custom.min.css',
                                    //'css/bootstrap.min.css',
                                    //'css/bootstrap-responsive.min.css',
                                    
                                    //'css/**',
                                    'js/pdfjs/**',
                                    'js/webL10n/**',
                                    'js/lib/**',
                                    'media/**',
                                    'locale/**',
                                    'js/require.js',
                                    'js/requireConfig.js',
                                    'js/templates.html',
                                    'js/modules/wsGet.js',
                                    //'js/modules/socketModule.js'
                                    
                                    'assets/requirejs/require.js',
                                    'assets/jquery/jquery.min.js',
                                    'assets/underscore/underscore-min.js',
                                    'assets/backbone/backbone-min.js',
                                    'assets/requirejs-text/text.js',
                                    'assets/jcrop/js/**',
                                    'assets/jquery-ui/ui/minified/jquery-ui.min.js',
                                    'assets/fullcalendar/fullcalendar.min.js',
                                    'assets/jquery.tagsinput/jquery.tagsinput.min.js',
                                    'assets/jquery.tagsinput/jquery.tagsinput.js',
                                    'assets/jquery-tmpl/jquery.tmpl.min.js',
                                    'assets/jquery.validation/jquery.validate.js',
                                    'assets/modernizr/modernizr.js',
                                   // "assets/webodf/webodf.js",
                                   
                                ]
                            } ]
                        },
                        components:{
                        	files:[{
	                        	expand:true,
	                        	src:[],
	                        	dest:'<%= yeoman.dist %>',
                        	}]
                        },
                        styles : {
                            expand : true,
                            dot : true,
                            cwd : '<%= yeoman.app %>/css',
                            dest : '.tmp/css/',
                            src : '{,*/}*.css'
                        }
                    },
                    concurrent : {
                        server : [ 'compass', 'copy:styles' ],
                        test : [ 'copy:styles' ],
                        dist : [ 'compass', 'copy:styles',  'svgmin','htmlmin' ]
                    }
			    });

	grunt.registerTask('build', ['clean:dist',
	                             'useminPrepare',
	                             'concurrent:dist',
	                             'concat',
	                             'cssmin',
	                             'uglify',
	                             'copy:dist',
	                             'usemin'
	                             ]);
	grunt.registerTask('serve',[]);
	
	grunt.registerTask('server',function(){
		
	});
	
	grunt.registerTask('test',[]);
	
	grunt.registerTask('default', ['jshint', 'build' ]);

};
