({
    appDir: "../",
    baseUrl: "./js/modules/",
    dir: "../../../akorp-build",
    modules: [
        {
            name: "../akorp"
        }
    ],
stubModules : ['text'],
optimize: "uglify",
optimizeAllPluginResources: true,
paths : {
		plugins : "../lib",
		bootstrap : "../lib/bootstrap.min",
		jquery : "../lib/jquery",
		underscore : "../lib/underscore-min",
		backbone : "../lib/backbone-min",
		text : "../lib/text",

	},
})
