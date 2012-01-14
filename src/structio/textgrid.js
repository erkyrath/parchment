/*

Text grid (ie, status) windows
==============================

Copyright (c) 2011 The Parchment Contributors
BSD licenced
http://code.google.com/p/parchment

*/

/*

TODO:
	Check cursor column is correct?

*/

var TextGrid = Object.subClass({
	// Set up the class, and attach a stream handler
	init: function( elem, io )
	{
		var self = this;
		// ZARF: check this flag when setting up the grid
		this.semanticcolor = io.env.semanticcolor;
		this.elem = elem
			.addClass( 'TextGrid' )
			.on( 'stream', function( e )
			{
				self.stream( e.order.data );
				return false;
			});
		if (!this.semanticcolor)
			this.elem.css( 'bgcolor', 'inherit' )
		this.lineheight = io.env.charheight;
		this.io = io;
		io.TextInput.statuswin = this.elem;
		this.lines = [];
		this.styles = [];
		this.lineswanted = 0;
		this.linesseen = 0;
		this.linedivs = [];
		this.cursor = [0, 0]; // row, col
	},
	
	// Accept a stream of text grid orders
	stream: function( orders )
	{
		var order, code, i, j,
		elem = this.elem,
		row = this.cursor[0],
		col = this.cursor[1],
		lines = this.lines,
		styles = this.styles,
		env = this.io.env,
		line, text, temp,
		styleelem,
		stylecode,
		oldheight = lines.length;
		
		// Process the orders
		for ( i = 0; i < orders.length; i++ )
		{
			order = orders[i];
			code = order.code;
			
			// Adjust the height of the grid
			if ( code == 'height' )
			{
				console.log('### height, wanted ' + order.lines + ', cur ' + lines.length);
				// Clear lines from the old height to the new height
				j = this.lineswanted;
				while ( j < lines.length )
				{
					this.addline( j++ );
				}
				// Increase the height
				while ( order.lines > lines.length )
				{
					this.addline();
				}
				// Set the new height (the VM's notion of it)
				this.lineswanted = order.lines;
				
				// Decrease the height, and handle box quotations
				// ZARF: in oldstylebox mode, we do not decrease lines.length
				// at this time. It only increases.
				if ( order.lines < lines.length && !env.oldstylebox )
				{
					if ( order.lines != 0 )
					{
						// Fix bad heights (that would split a multi-line status) by increasing the requested height to the first blank line
						while ( /\S/.test( lines[order.lines].join( '' ) ) && order.lines < lines.length )
						{
							order.lines++;
						}
					
						// Add the floating box
						temp = $( '<div>' )
							.addClass( 'box' )
							.prependTo( this.io.target );
						// Position it where it would have been if it was part of the grid
						// Scroll to the bottom just in case
						window.scrollTo( 0, 9e9 );
						temp.css({
							top: $window.scrollTop() + this.lineheight * order.lines,
							// Account for .main's added 1px padding
							left: (this.io.env.scrollparent ? 0 : temp.offset().left - 1)
						});
						// Fill it with the lines we'll be removing
						this.write( temp, lines.slice( order.lines ), styles.slice( order.lines ) );
					}
				
					lines.length = order.lines;
					styles.length = order.lines;
					if ( row > order.lines - 1 )
					{
						row = 0;
						col = 0;
					}
				}
			}
			
			// Empty the grid, but don't change it's size
			if ( code == 'clear' )
			{
				console.log('### clear, cur lines ' + lines.length);
				j = 0;
				while ( j < lines.length )
				{
					this.addline( j++ );
				}
				row = 0;
				col = 0;
			}
			
			if ( code == 'cursor' )
			{
				row = order.to[0];
				col = order.to[1];
				console.log('### cursor to ' + row);
				
				// Add a row(s) if needed
				while ( row >= lines.length )
				{
					this.addline();
				}
				if (row+1 > this.lineswanted)
					this.lineswanted = row+1;
			}
			
			if ( code == 'get_cursor' )
			{
				order.pos = [row, col];
				this.io.input( order );
			}
			
			// Add text to the grid
			if ( code == 'stream' )
			{
				// Add a row(s) if needed
				while ( row >= lines.length && !env.oldstylebox )
				{
					this.addline();
				}
					
				// ZARF: add a simpler way
				if (!this.semanticcolor) {
					// Calculate the style attribute for this set of text
					stylecode = undefined;
					if ( order.css )
					{
						styleelem = $( '<tt>' )
							.appendTo( elem )
							.css( order.css );
						if ( order.css.reverse )
						{
							do_reverse( styleelem );
						}
						stylecode = styleelem.attr( 'style' );
						if ( stylecode )
						{
							stylecode = ' style="' + stylecode + '"';
						}
					}
				}
				else {
					stylecode = undefined;
					if ( order.css && order.css.reverse )
						stylecode = ' class="Reverse"';
				}

				// Add the text to the arrays
				text = order.text;
				j = 0;
				while ( j < text.length )
				{
					temp = text.charAt( j++ );
					// Regular character
					if ( temp != '\n' && row < lines.length)
					{
						lines[row][col] = temp;
						styles[row][col++] = stylecode;
					}
					// New line, or end of a line
					if ( temp == '\n' || col == env.width )
					{
						row++;
						col = 0;
						
						// Add a row if needed
						if ( row >= lines.length && !env.oldstylebox )
						{
							this.addline();
						}
					}
				}
				console.log('### stream left row at ' + row);
			}
			
			if ( code == 'eraseline' )
			{
				for ( j = col; j < env.width; j++ )
				{
					lines[row][j] = ' ';
					styles[row][j] = undefined;
				}
			}
		}
		
		// Update the cursor
		this.cursor = [row, col];
		
		// Update the HTML
		if (!env.oldstylebox)
			this.write( elem, lines, styles );
		else
			this.writeoldstyle( elem, lines, styles );
		
		// Try to adjust the main window's padding - for now guess what the window's class is
		if ( lines.length != oldheight )
		{
			$( '.main' )
				.css( 'padding-top', elem.height() );
		}
	},
	
	// Update the HTML
	write: function( elem, lines, styles )
	{
		var result = '',
		i = 0, j,
		text,
		style;

		// Go through the lines and styles array, constructing a <tt> whenever the styles change
		while ( i < lines.length )
		{
			text = '';
			style = styles[i][0];
			for ( j = 0; j < lines[i].length; j++ )
			{
				if ( styles[i][j] == style )
				{
					text += lines[i][j];
				}
				else
				{
					result += '<tt' + ( style || '' ) + '>' + text + '</tt>';
					style = styles[i][j];
					text = lines[i][j];
				}
			}
			result += '<tt' + ( style || '' ) + '>' + text + '</tt>';
			if ( ++i < lines.length )
			{
				result += '<br>';
			}
		}
		elem.html( result );
	},

	writeoldstyle: function( elem, lines, styles )
	{
		var result = '',
		i = 0, j,
		text,
		style;
		console.log('### input time: lines ' + lines.length + ', wanted ' + this.lineswanted + ', divs ' + this.linedivs.length);

		if (this.lines.length == this.linesseen && this.lineswanted < this.linedivs.length) {
			for (var ix=this.lineswanted; ix<this.linedivs.length; ix++) {
				this.linedivs[ix].remove();
			}
			this.linedivs.length = this.lineswanted;

			if (this.lines.length > this.lineswanted) {
				this.lines.length = this.lineswanted;
				this.styles.length = this.lineswanted;
			}
		}

		// Any linedivs hanging over the current lines length must be
		// last turn's quotebox. Politely fade them out (and remove from
		// linedivs).
		if (lines.length < this.linedivs.length)
		{
			var fade_and_remove = function(el) {
				el.fadeOut(400, function() { el.remove(); });
			};
			for (var ix=lines.length; ix<this.linedivs.length; ix++) {
				fade_and_remove(this.linedivs[ix]);
			}
			this.linedivs.length = lines.length;
		}
		
		// Go through the lines and styles array, constructing a <tt>
		// whenever the styles change. Unlike the write() method above,
		// we make a separate div for each line. (This allows us to delete
		// and fade specific lines.)
		while ( i < lines.length )
		{
			result = '';
			text = '';
			style = styles[i][0];
			for ( j = 0; j < lines[i].length; j++ )
			{
				if ( styles[i][j] == style )
				{
					text += lines[i][j];
				}
				else
				{
					result += '<tt' + ( style || '' ) + '>' + text + '</tt>';
					style = styles[i][j];
					text = lines[i][j];
				}
			}
			result += '<tt' + ( style || '' ) + '>' + text + '</tt>';
			if (i < this.linedivs.length) {
				this.linedivs[i].html(result);
			}
			else {
				var linediv = $( '<div>' ).html(result);
				elem.append(linediv);
				this.linedivs[i] = linediv;
			}
			this.linedivs[i].show();
			i++;
		}

		// Now we can drop the text of lines beyond the VM's window height.
		if (this.lines.length > this.lineswanted) {
			this.lines.length = this.lineswanted;
			this.styles.length = this.lineswanted;
		}
		this.linesseen = this.lineswanted;
		console.log('### ... after: lines ' + lines.length + ', wanted ' + this.lineswanted + ', divs ' + this.linedivs.length);
	},
	
	// Add a blank line
	addline: function( row )
	{
		var width = this.io.env.width,
		line = [],
		i = 0;
		row = row || this.lines.length;
		while ( i++ < width )
		{
			line.push( ' ' );
		}
		this.lines[row] = line;
		this.styles[row] = Array( width );
	}
});