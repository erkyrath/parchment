/*
 * Parchment load scripts
 *
 * Copyright (c) 2008-2010 The Parchment Contributors
 * Licenced under the GPL v2
 * http://code.google.com/p/parchment
 */
(function(window){

var parchment = window.parchment;

// Load Parchment, start it all up!
function load_parchment()
{
	// Check for any customised options
	if (window.parchment_options)
		$.extend(parchment.options, parchment_options);

	// Load the library
	var library = new Library();
	parchment.library = library;
	library.load();

	// Add the Analytics tracker, but only if we're at parchment.googlecode.com
	if (location.href.slice(0, 31) == 'http://parchment.googlecode.com')
		$.getScript('http://www.google-analytics.com/ga.js', function(){_gat._getTracker("UA-7949545-1")._trackPageview();});
}

$(load_parchment);

})(window);
