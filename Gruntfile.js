module.exports = function( grunt )
{
	"use strict";
	
	/* jshint -W070 */ // Allow trailing commas only in the Gruntfile
	
	grunt.initConfig({
	
		concat: {
			options: {
				process: true,
			},
			all: {
				files: {
					'lib/parchment.debug.js': [
						'src/parchment/header.txt',
						'src/lib/class.js',
						'src/lib/iff.js',
						'src/structio/intro.js',
						'src/structio/input.js',
						'src/structio/textgrid.js',
						'src/structio/api.js',
						'src/structio/outro.js',
						'src/structio/runner.js',
						'src/parchment/intro.js',
						'src/parchment/error-handling.js',
						'src/parchment/file.js',
						'src/parchment/ui.js',
						'src/parchment/library.js',
						'src/parchment/quixe.js',
						'src/parchment/ifvms.js',
						'src/parchment/gnusto.js',
						'src/parchment/outro.js',
						'src/parchment/quixe-runner.js',
					],
					'lib/parchment-bare.debug.js': [
						'src/parchment/header.txt',
						'src/lib/class.js',
						'src/lib/iff.js',
						'src/structio/intro.js',
						'src/structio/input.js',
						'src/structio/textgrid.js',
						'src/structio/api.js',
						'src/structio/outro.js',
						'src/structio/runner.js',
						'src/parchment/error-handling.js',
						'src/parchment/file.js',
						'src/parchment/ui.js',
						'src/parchment/library.js',
						'src/parchment/quixe.js',
						'src/parchment/ifvms.js',
						'src/parchment/gnusto.js',
						'src/parchment/quixe-runner.js',
					],
					'lib/parchment.debug.css': [
						'src/parchment/header.txt',
						'src/parchment/parchment.css',
						'src/structio/structio.css',
						'src/ifvms.js/dist/zvm.css',
					],
					'lib/gnusto.debug.js': [
						'src/gnusto/header.txt',
						'src/ifvms.js/src/zvm/quetzal.js',
						'src/gnusto/remedial.js',
						'src/gnusto/engine/gnusto-engine.js',
						'src/ifvms.js/src/zvm/ui.js',
						'src/gnusto/runner.js',
					],
					'lib/quixe.min.js': [
						'src/quixe/lib/quixe.min.js',
					],
					'lib/glkote.min.js': [
						'src/quixe/lib/glkote.min.js',
					],
					'lib/glkote.debug.css': [
						'src/quixe/media/i7-glkote.css',
						'src/quixe/media/dialog.css',
					],
					'lib/zvm.debug.js': [
						'src/ifvms.js/dist/zvm.js'
					],
					'.build/(manifest).txt': [
						'src/parchment/(manifest).txt'
					],
				},
			},
		},
		
		cssmin: {
			parchment: {
				options: {
					banner: grunt.file.read( "src/parchment/header.txt" ),
				},
				files: {
					'lib/parchment.min.css': [ 'lib/parchment.debug.css' ],
				},
			},
			glkote: {
				files: {
					'lib/glkote.min.css': [ 'lib/glkote.debug.css' ],
				},
			},
		},
		
		jshint: {
			options: {
				// Enforcing options
				curly: true, // Require brackets for all blocks
				eqeqeq: true, // Require === and !==
				latedef: true, // require all vars to be defined before being used
				newcap: true, // require classes to begin with a capital
				strict: true, // ES5 strict mode
				undef: true, // all vars must be defined
				unused: true, // warn for unused vars
				
				// Relaxing options
				boss: true, // Allow assignments in if, return etc
				evil: true, // eval() :)
				funcscope: true, // don't complain about using variables defined inside if statements
				
				// Environment
				browser: true,
				node: true,
				nonstandard: true,
				predef: [
					'DEBUG',
				],
			},
			all: [
				'Gruntfile.js'
			],
		},
		
		uglify: {
			options: {
				beautify: {
					ascii_only: true,
				},
				compress: {
					global_defs: {
						DEBUG: false,
					},
				},
				mangle: {
					'eval': true,
				},
				preserveComments: function( node, token ) { return (/Built/).test( token.value ); },
				report: false,
			},
			parchment: {
				files: {
					'lib/parchment.min.js': [ 'lib/parchment.debug.js' ],
					'lib/parchment-bare.min.js': [ 'lib/parchment-bare.debug.js' ],
					'lib/gnusto.min.js': [ 'lib/gnusto.debug.js' ],
				},
			},
			zvm: {
				options: {
					compress: {
						global_defs: {
							DEBUG: false,
							ZVM: true,
							GVM: false,
						},
					},
				},
				files: {
					'lib/zvm.min.js': [ 'lib/zvm.debug.js' ],
				}
			},
		},
		
		zip: {
			inform7: {
				compression: 'DEFLATE',
				dest: 'lib/parchment-for-inform7.zip',
				src: [
					'lib/jquery.min.js',
					'lib/parchment.min.css',
					'lib/parchment.min.js',
					'lib/zvm.min.js',
					'.build/(manifest).txt',
				],
				router: function( path ) { return 'Parchment/' + require( 'path' ).basename( path ); },
			},
		},
	});

	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-update-submodules' );
	grunt.loadNpmTasks( 'grunt-zip' );

	grunt.registerTask( 'default', [ 'update_submodules', 'parchment', 'inform7' ] );

	grunt.registerTask( 'inform7', [ 'zip' ] );

	grunt.registerTask( 'parchment', [ 'concat', 'jshint', 'cssmin', 'uglify' ] );
};