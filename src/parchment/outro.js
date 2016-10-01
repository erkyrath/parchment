/*

Parchment load scripts
======================

Copyright (c) 2008-2011 The Parchment Contributors
BSD licenced
http://code.google.com/p/parchment

*/

// Load Parchment, start it all up!
$(function()
{

/* Unlike in regular Parchment, this code is not executed at page-ready
   time. Instead, we must wait for the Lectrote process to hand us a game
   file to load. 

   Therefore, this code goes into a function: parchment.load_library().
*/
function load_library(game_options) 
{
	var library;
	
	// Check for any customised options
        if ( !game_options )
            game_options = window.game_options;

	if ( game_options )
	{
		$.extend( parchment.options, game_options );
	}
	
	// Load additional options from the query string
	// Is a try/catch needed?
	if ( !parchment.options.lock_options && urloptions.options )
	{
		$.extend( parchment.options, $.parseJSON( urloptions.options ) );
	}
	
	// Some extra debug options
	/* DEBUG */
	parchment.options.debug = urloptions.debug;
	/* ENDDEBUG */
	
	// Load the library
	library = new parchment.lib.Library();
	parchment.library = library;
	library.load();
}

parchment.load_library = load_library;

});

})( this, jQuery );