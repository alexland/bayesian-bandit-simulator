
$(function() {

	var ARMS = [0, 0, 0, 0, 0, 0],
		_PROBS = [rbeta(2,9), rbeta(5,9), rbeta(5,9)],
		BB_RUN = 0;

	d3.select( "#reveal-div" )
		.selectAll("p")
		.data( _PROBS )
		.enter()
		.append("p")
			.text( function(d, i) {
				return "lever " + (i + 1) + ": " +d.toFixed(4);
			})
		
	//---------- fns re probability distributions --------------//
			
	function pdfbeta(x_array, a, b) {
		//x is an array
		_beta = Beta(a,b);
		function _pdfbeta(x) {
			return (Math.pow(x, a-1)*Math.pow(1-x, b-1))/_beta 
		}
		return x_array.map( _pdfbeta )
	}
    
	function Beta(a, b) {
		// stirlings approx
		// use logs and exponentials to avoid underflow
		// with logs is still giving me errors
		// var n = Math.pow(a, a - 0.5)*Math.pow(b, b-0.5);
		var log_n = Math.log(a)*(a - 0.5) + Math.log(b)*( b-0.5);
		// var d = Math.pow( a + b, a+ b-0.5)
		var log_d = Math.log( a + b)*(a+ b-0.5);
		return Math.sqrt( 2*Math.PI)*Math.exp(log_n - log_d)
	}

	function rbeta(a, b) {
		//from simulation and MC, Wiley
		var p = a/b;
		if (Math.min(a,b) <= 1) {
			var lambda =  Math.min(a,b)
		} 
		else {
			var lambda = Math.sqrt( (2*a*b - a - b)/(a+b-2) )
		}
		while (1) {
			var R1 = Math.random();
			var R2 = Math.random();
			var y = Math.pow( ( 1./R1 - 1.), 1./lambda );
			if (4*R1*R2*R2 < (Math.pow(y, a-lambda)*Math.pow((1+p)/(1+p*y), a+b))) {
				return (p*y)/(1+p*y) 
			}
		}
	}
        
	function rbeta_array(arm_counts) {
		// used with ARMS with uniform prior
		samples = []
		for (var i=0; i < arm_counts.length/2; i++) {
			samples.push( 
				rbeta(arm_counts[2*i+1]+1, 1+arm_counts[2*i]-arm_counts[2*i+1]) 
			)
		}
		return samples
	}

	function draw_arm(p) {
		if (Math.random() < p) { 
			return 1 
		} 
		else { 
			return 0 
		}
	}

	function update_arm(arm_number) {
		var result = draw_arm(_PROBS[arm_number] );
		ARMS[2*arm_number] += 1;
		ARMS[2*arm_number+1] += result;
		redraw(arm_number);
		return
	}
	
	function bayesian_bandits(){
		//for (var i = 0; i < n_pulls; i++ ){
		//sample from Beta distributions
		var samples = rbeta_array(ARMS);
		var select = samples.indexOf( d3.max( samples) );
		update_arm(select);
		if (BB_RUN < 300) {
			BB_RUN += 1;
			window.setTimeout(bayesian_bandits, 100)
		}
		else {
			return 
		}
	}
    
	// ----------------------------------------------- //
	
	var x_array = [],
		_N = 100,
		max_data = 10;
	for (var i=0; i<_N; i++) {
		x_array.push(.01*i)
	}
	var colors = ["#E9D66B", "#1DACD6", "#0E7C61"],
		fill_colors = colors;

	var W = 600,
		H = 150,
		M = 15;
	
	y = d3.scale.linear()
		.domain([0, max_data])
		.range([H - M, 0 + M]),
		
	x = d3.scale.linear()
		.domain([0,_N])
		.range([0 + M, W - M])

	var vis = d3.select("#gr2")    // beta plots
		.append("svg")
		.attr("width", W)
		.attr("height", H)

	var g = vis.append("g")

	var line = d3.svg.line()
		.x(function(d, i) { 
			return x(i); 
		})
		.y(y)

	for (var i =0; i < 3; i++) {
		var _data = pdfbeta(x_array, 1 + ARMS[2*i+1],1+ARMS[2*i] - ARMS[2*i+1]);
		g.selectAll('path.line')
			.data( [_data] )
			.enter()
			.append("path")
				.attr("stroke", colors[i] )
				.attr("d", line )
				.attr("id", "line-" + i );
	}

	g.append("line")
		.attr("x1", x(0))
		.attr("y1",  y(0))
		.attr("x2", x(W))
		.attr("y2", y(0))

	g.append("line")
		.attr("x1", x(0))
		.attr("y1", y(0))
		.attr("x2", x(0))
		.attr("y2", y(max_data))

	g.selectAll(".xLabel")
		.data( d3.range(0,1.2,.2) )
		.enter().append("svg:text")
		.attr("class", "xLabel")
		.text(String)
		.attr("x", function(d) { return x(100*d) })
		.attr("y", H)
		.attr("text-anchor", "middle")
		.attr("dy", 0.0 )
	
	g.selectAll(".xTicks")
		.data(x.ticks(5))
		.enter().append("svg:line")
		.attr("class", "xTicks")
		.attr("x1", function(d) { return x(d); })
		.attr("y1", y(0))
		.attr("x2", function(d) { return x(d); })
		.attr("y2", y(-0.1))

	vis.append("text")
		.attr("x", (W / 2))             
		.attr("y", 15 )
		.attr("text-anchor", "middle")  
		.style("font-size", "17px") 
		.text("Posterior Distributions");
		

	// data for bar chart: 2 time-series, alternating to form a single series
	// bar color will switch back & forth
	var data = ARMS;
	var labellist = ["lever 1", "", "lever 2", "", "lever3", ""];

	var w_bar = 600,
		h_bar = 170,
		labelpad = 50,
		x_bar = d3.scale.linear()
			.domain([0, 100])
			.range([0, w_bar]),
		y_bar = d3.scale.ordinal()
			.domain(d3.range(data.length))
			.rangeBands([0, h_bar], .2);

	var vis = d3.select("#gr1")
		.append("svg")
		.attr("width", w_bar + 40)
		.attr("height", h_bar + 20)
		.append("g")

	var bars = vis.selectAll("g.bar")
		.data(data)
		.enter().append("g")
		.attr("class", "bar")
		.attr("transform", function(d, i) {
			return "translate(" + labelpad + "," + y_bar(i) + ")";
		})

	bars.append("rect")
	// alternate colors
	.attr("fill", function(d, i) {
	return (i%2)? colors[i]: fill_colors[i];
	} )
	.attr("width", function(d,i) { 
		return x_bar(d)*0.5 
	})
	.attr("height", y_bar.rangeBand());

	bars.append("text")
		.attr("x", 0)
		.attr("y", 10 + y_bar.rangeBand() / 2)
		.attr("dx", -6)
		.attr("dy", ".50em")
		.attr("text-anchor", "end")
		.text(function(d, i) {
			return labellist[i]; 
		});

	var counts = bars.append("text")
		.attr("x", 0)
		.attr("y", 10 + y_bar.rangeBand() / 2)
		.attr("dx", -6)
		.attr("dy", "-.40em")
		.attr("text-anchor", "end")
		.text(function(d, i) { return ""; });

	var rules = vis.selectAll("g.rule")
		.data(x.ticks(10))
		.enter().append("svg:g")
		.attr("class", "rule")
		.attr("transform", function(d) {
			return "translate(" + x_bar(d) + ", 0)";
		});

	rules.append("line")
		.attr("y1", 0)
		.attr("y2", h_bar)
		.attr("x1", labelpad)
		.attr("x2", labelpad)
		.attr("stroke", "white")
		.attr("stroke-opacity", .3);

	// ----------------- widgets -------------- //

	$("#btn1").on("click", function(event) {
		update_arm(1);
	});

	$("#btn2").on("click", function(event) {
		update_arm(2);
	});

	$("#btn3").on("click", function(event) {
		update_arm(3);
	});
	
	$("#btn4").on("click", bayesian_bandits);
	
	// $("#btn5").on("click", function(event) {
//
// 	});


	//---------- main fn to update data view ------------//

	function redraw(arm_number) {
		var _data = []
		for ( var i =0; i < 3; i++){
		_data.push(pdfbeta(x_array, 1 + ARMS[2*i+1],1+ARMS[2*i] - ARMS[2*i+1]));  
	}
	
	//update what is max
	max_data = d3.max( [ 
	10, 
	d3.max(_data[0]),
	d3.max(_data[1]),
	d3.max(_data[2]) ])

	y = d3.scale.linear()
		.domain([0, max_data])
		.range([H - M, 0 + M])
		
	line = d3.svg.line()
		.x(function(d, i) { return x(i); })
		.y(y)

	for ( var i =0; i < 3; i++){
		g.select("#line-" + i)
			.data( [_data[i]] )
			.attr("d", line )
		}

	bars.data(ARMS)
		.enter().append("g")
		.attr("class", "bar")
		.attr("transform", function(d, i) { 
			return "translate(" + labelpad + "," + y(i) + ")"; 
		});

	bars.append("rect")
	// alternate colors
	.attr("fill", function(d, ix) {
		_ix = Math.floor(ix/2); return (ix%2)? fill_colors[_ix]: colors[_ix];
	})   
	.attr("width", function(d,i) { 
		return x_bar(d)*0.5 
	})
	.attr("height", y_bar.rangeBand());


	counts
	.attr("x", 0)
	.attr("y", 10 + y_bar.rangeBand() / 2)
	.attr("dx", function( d,i) { return !(i%2) ? 50 + 3.2*data[i] : 67 + 3.2*data[i] ;})
	.attr("dy", "-.40em")
	.attr("text-anchor", "end")
	.text(function(d, i) { return !(i%2) ? data[i] + " pulls" : data[i] + " rewards" ;});

	//update scoreboard
	var rewards =  ARMS[1] + ARMS[3] + ARMS[5];
	var pulls = ARMS[0] + ARMS[2] + ARMS[4];
	document.getElementById("rewards").innerHTML = rewards ;
	document.getElementById("pulls").innerHTML = pulls ;
	document.getElementById("ratio").innerHTML = (rewards/pulls).toFixed(3) ;

	}
	d3.select( "#reveal-div" )
		.selectAll("p")
		.data( _PROBS )
		.enter()
		.append("span")
		.attr( "style", "margin-left:15; margin-right: 30px; margin-top:0" )
		.text( function(d,i) {
			return  d.toFixed(4) ; 
		})
	
	//redraw()


});
