/*

StructIO
========

Copyright (c) 2011 The Parchment Contributors
BSD licenced
http://code.google.com/p/parchment

*/

/*

TODO:
	Timed input
	input terminators
	Listen for the window being resized to smaller than the current width
	Allow the window to be drag-resized
	Detect that position: fixed doesn't work

*/

// Function to replace initial spaces with entities the browsers will respect. &ensp; seems a better width than &nbsp;
var space_replacer = function( spaces )
{
	return '\n' + Array( spaces.length ).join( '&ensp;' );
},

space_replacer_2 = function( spaces )
{
	return Array( spaces.length ).join( '\u00A0' ) + ' ';
},

// Root stream handler. Some structures (like text grids) could have alternative handlers
basic_stream_handler = function( e )
{
	var order = e.order,
	struct = e.io.structures[order.name] || { node: 'span' },
	node = order.node || struct.node,
	text = order.text,
	
	// Create the new element and set everything that needs to be set
	elem = $( '<' + node + '>' )
		.appendTo( e.target )
		.addClass( order.name )
		.css( order.css || {} );
	if ( order.css && order.css.reverse )
	{
		do_reverse( elem );
	}
	// Add the text, if we've been given any
	if ( text )
	{
		// Fix initial spaces, but not for tt (which will actually mess it up)
		// For tt's, fix all spaces so that they will still wrap
		//text = node == 'tt' ? text.replace( /( +)/g, '<span class="space">$1</span>' ) : text.replace( /\n +(?=\S)/g, space_replacer );
		// ZARF: Do this in a cleaner way.
		text = text.replace( /( +) /g, space_replacer_2 );
		text = text.replace( /^ /mg, '\u00A0');
		// elem.html( text.replace( /\n/g, '<br>' ) );
		// ZARF: also insert <br> tags in a cleaner way.
		var subls = text.split("\n");
		for (var ix=0; ix<subls.length; ix++) {
			if (ix != 0)
				elem.append($('<br>'));
			if (subls[ix].length)
				elem.append(document.createTextNode(subls[ix]));
		}
	}
	
	// If we have a custom function to run, do so
	if ( struct.func )
	{
		struct.func( elem, e.io );
	}
		
	return false;
},

// Pattern for getting the RGB components from a colour
RGB_pattern = /(\d+),\s*(\d+),\s*(\d+)/,

// The public API
// .input() must be set by whatever uses StructIO
StructIO = Object.subClass({
	
	init: function( env )
	{
		env = extend( {}, env );
		this.env = env;
		var element = $( env.container ),
		
		// Calculate the width we want
		// ZARF: Specify class="TextGrid" for the test text
		measureelem = $( '<tt class="TextGrid">00000</tt>' )
			.appendTo( element ),
		charheight = measureelem.height(),
		charwidth = measureelem.width() / 5,
		widthinchars = Math.min( Math.floor( element.width() / charwidth ), env.width || 80 );
		measureelem.remove();
		
		extend( env, {
			charheight: charheight,
			charwidth: charwidth,
			width: widthinchars,
			fgcolour: RGB_pattern.exec( element.css( 'color' ) ).slice( 1 ),
			bgcolour: RGB_pattern.exec( element.css( 'bgcolor' ) ).slice( 1 )
		});
		// Set the container's width: +2 to account for the 1px of padding the structures inside will receive to hide obnoxious serifs
		element.width( widthinchars * charwidth + 2 );
		
		this.container = element
		this.target = element;
		element.on( 'stream', basic_stream_handler );
		// ZARF: pass the scrollparent element name, if provided
		this.TextInput = new TextInput( element, env.scrollparent );
		
		// Default structures
		this.structures = {
			main: {
				node: 'div'
			},
			status: {
				node: 'div',
				func: function( elem, io ) { new TextGrid( elem, io ); }
			}
		};
	},
	
	// Process some output events
	event: function( orders )
	{
		var order, code, i,
		target = this.target,
		temp;
		
		// Process the orders
		for ( i = 0; i < orders.length; i++ )
		{
			order = orders[i];
			code = order.code;
			
			// Specify the elements to use for various structures
			// All structures must specify at least the node to use
			if ( code == 'structures' )
			{
				order.code = undefined;
				$.extend( this.structures, order );
			}
			
			// Find a new target element
			if ( code == 'find' )
			{
				this.target = target = $( '.' + order.name );
			}
			
			// Add a structure
			if ( code == 'stream' )
			{
				// .to will let you temporarily stream to something else
				( order.to ? $( '.' + order.to ) : target )
					.trigger({
						type: 'stream',
						io: this,
						order: order
					});
			}
			
			if ( code == 'clear' )
			{
				var temp = order.name ? $( '.' + order.name ) : target;
				temp.empty();
				// Set the background colour
				// If we're clearing the main window, then change <body> instead
				// ZARF: ... or the colorparent, or the scrollparent, if appropriate
				if ( order.css && order.css['background-color'] )
				{
					if (order.name == 'main')
					{
						if (this.env.colorparent)
							temp = $(this.env.colorparent);
						else if (this.env.scrollparent)
							temp = $(this.env.scrollparent);
						else
							temp = $body;
					}
					temp.css( 'background-color', order.css['background-color'] );
				}
			}
			
			// Line input
			if ( code == 'read' )
			{
				order.target = target;
				this.TextInput.getLine( order );
			}
			
			// Character input
			if ( code == 'char' )
			{
				this.TextInput.getChar( order );
			}
		}
	}
});