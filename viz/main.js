
// TODO: add constraint for variance among three levers' reward/trials
// TODO: create sliders so user can set _PROBS

	var ARMS = [0,0,0,0,0,0],
		BB_RUN = 0;
    
	// lever reward probabilities
	var lrp = [rbeta(2,9), rbeta(5,9), rbeta(5,9)],
		lrp_obj = {
			"L1": rbeta(2,9),
			"L2": rbeta(5,9),
			"L3": rbeta(5,9)
		};
	
	var keys = Object.keys(lrp_obj),
		len_keys = keys.length,
		lrp_arr = [];

	 for (var i=0; i<len_keys; i++) {
		 key = keys[i]
		 row = [ key, lrp_obj[key] ];
		 lrp_arr.push(row);
	};

	var table = d3.select("#lrp");
		caption = table.append("caption")
			.text("lever reward probabilities");

	var rows = table.selectAll("tr")
		.data(lrp_arr)
		.enter()
		.append("tr");

	var cells = rows.selectAll("td")
		.data(function(d, i) {
			return d;
		})
		.enter()
		.append("td")
			.text(function(d, i) {
				if (typeof(d) === 'number') {
					return +d.toFixed(3);
				}
				else {
					return d;
				}
			});


	
    function pdfbeta(x_array, a, b) {
        //x is an array
        _beta = Beta(a,b);
        function _pdfbeta(x){
            return (Math.pow(x, a-1)*Math.pow(1-x, b-1) )/_beta 
        }
        
        return x_array.map(_pdfbeta)
    }
    
    function Beta(a,b){
        var log_n = Math.log(a)*(a - 0.5) + Math.log(b)*( b-0.5)
        //var d = Math.pow( a + b, a+ b-0.5)
        var log_d = Math.log( a + b)*(a+ b-0.5)
        return Math.sqrt( 2*Math.PI)*Math.exp(log_n - log_d)
        }

    
	function rbeta(a, b) {
		var p = a/b;
		if (Math.min(a,b) <= 1) {
			var lambda =  Math.min(a,b)
		}
		else {
			var lambda = Math.sqrt((2*a*b-a-b)/(a+b-2))
		}
		while (1) {
			var R1 = Math.random();
			var R2 = Math.random();
			var y = Math.pow( ( 1./R1 - 1.), 1./lambda );
			if (4*R1*R2*R2 < (Math.pow(y, a-lambda)*Math.pow((1.0+p)/(1+p*y), a+b))) {
				return (p*y)/(1+ p*y) 
			}
		}
	}
        
	function rbeta_array( arm_counts){
		samples = []
		for (var i=0; i < arm_counts.length/2; i++) {
			samples.push( 
				rbeta(arm_counts[2*i+1]+1, 1+arm_counts[2*i]-arm_counts[2*i+1]) 
			)
		}
		return samples
	}
        
	function draw_arm( p ) {
		if (Math.random() < p) {
			return 1 
		} 
		else { 
			return 0
		}
    }
     
    function update_arm(arm_number) {
        var result = draw_arm(lrp[arm_number]);
        ARMS[2*arm_number] += 1;
        ARMS[2*arm_number+1] += result;
        redraw(arm_number);
        return
    }
    
    function bayesian_bandits() {
        //for (var i=0; i<n_pulls; i++) {
            //sample from Beta distributions
            var samples = rbeta_array(ARMS);
            var select = samples.indexOf( d3.max( samples) );
            update_arm(select);
            if (BB_RUN < 300){
                BB_RUN += 1;
                window.setTimeout( bayesian_bandits, 100)
            }
            else{
                return 
            }
        //}
    }
    
    var x_array = [];
    var _N = 100;
    for (var i=0; i< _N; i++) {
        x_array.push(.01*i)
    }
	
	//----------------------- data viz ----------------------//

	var colors = [	
		"#E9D66B", "#E9D66B",
		"#0C738E", "#0C738E",
		"#3AB5A9", "#3AB5A9"
	],
	fill_colors = colors;
   
	var container_dims = {W: 560, H: 250}, 
		BAR_HEIGHT = 20,
		MRG = {T: 10, R: 20, B: 30, L: 50},
		chart_dims = {
			W: container_dims.W - MRG.L - MRG.R,
			H: container_dims.H - MRG.T - MRG.B
		};
		
	var xScale = d3.scale.linear()
		.range([0, chart_dims.W])
		.domain([0, _N]);
			
	var yScale = d3.scale.linear()
		.range([chart_dims.H, 0]);
		
	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom")
		.ticks(10);
		
	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left")
		.ticks(5);

	pdf_plotter = d3.svg.line()
	    .x(function(d, i) {
			return xScale(i);
			})
	    .y(function(d, i) {
	    	return yScale(d);
	    })
		.interpolate("basis");
		
	var plotWin2 = d3.select("#plot2")
		.append("svg")
			.attr({
				width: container_dims.W,
				height: container_dims.H
			})
		.append("g")
			.attr({
				transform: "translate(" + MRG.L + "," + MRG.T + ")",
				id: "plotWin2"
			});
    
	plotWin2.append("g")
		.attr({
			"class": "x axis",
			transform: "translate(0," + chart_dims.H + ")"
		})
		.call(xAxis);
		
	plotWin2.append("g")
		.attr({
			"class": "y axis"
		})
		.call(yAxis); 
			
	var L1g = d3.select("#plotWin2")
		.append("g")
		.attr("id", "L1g");
	
	var L2g = d3.select("#plotWin2")
		.append("g")
		.attr("id", "L2g");
		
	var L3g = d3.select("#plotWin2")
		.append("g")
		.attr("id", "L3g");
		
	for (var i=0; i<3; i++) {
		var _data = pdfbeta(x_array, 1+ARMS[2*i+1], 1+ARMS[2*i]-ARMS[2*i+1] );
	};
		
	var L1d = _data[0],
		L2d = _data[1],
		L3d = _data[2];
	
	yExtent = d3.extent(L1d);
	
	yScale
		.domain(yExtent);
	
	d3.select("#L1g")
		.append("path")
		.datum(L1d)
			.attr({
				d: pdf_plotter,
				stroke: "#E9D66B",
				"stroke-width": 1.5,
				"id": "L1p"
			});

	d3.select("#L2g")
		.append("path")
			.datum(L2d)
			.attr({
				d: pdf_plotter,
				stroke: "#0C738E",
				"stroke-width": 1.5,
				"id": "L2p"
			});


	d3.select("#L3g")
		.append("path")
		.datum(L3d)
			.attr({
				d: pdf_plotter,
				stroke: "#3AB5A9",
				"stroke-width": 1.5,
				"id": "L3p"
			});

    // data for bar chart: two time-series, 
	// alternating to form a single series. 
	BAR_PAD = 0.2;
	
    var data = ARMS;
    var labellist = ["L1 t", "L1 r", "L2 t", "L2 r", "L3 t", "L3 r"];
	
   xScale_bar = d3.scale.linear()
		.range([0, chart_dims.W])
		.domain([0, 300]);       // FIXME: refactor to remove hard-coded values
	
	yScale_bar = d3.scale.ordinal()
		.rangeRoundBands([0, chart_dims.H], BAR_PAD)
		.domain(d3.range(ARMS.length));
		
	xAxis_bar = d3.svg.axis()
		.scale(xScale_bar)
		.ticks(10)
		.orient("bottom");
		
	yAxis_bar = d3.svg.axis()
		.scale(yScale_bar)
		.ticks(0)
		.tickFormat("")
		.tickSize(0)
		.orient("left");
		
	var plotWin1 = d3.select("#plot1")
		.append("svg")
			.attr({
				width: container_dims.W,
				height: container_dims.H
			})
		.append("g")
			.attr({
				transform: "translate(" + MRG.L + "," + MRG.T + ")",
				id: "dataView1"
			});
		
	plotWin1.append("g")
		.attr({
			"class": "x axis",
			transform: "translate(0," + chart_dims.H + ")"
		})
		.call(xAxis_bar);
	
	plotWin1.append("g")
		.attr({
			"class": "y axis"
		})
		.call(yAxis_bar); 

    var bars = plotWin1.selectAll("rect")
		.data(ARMS)
		.enter().append("rect")
		.attr({
			"class": "bar",
			y: function(d, i) {
				return yScale_bar(i);
			},
			x: 0,
			width: function(d, i) {
				return xScale_bar(d);
			},
			height: yScale_bar.rangeBand(),
			fill: function(d, i) {
				return (i%2)? colors[i]: fill_colors[i];
			}
		});
       
	   
	// ----------------------- re-drawing plots ----------------------// 
	   
    function redraw(arm_number) {
        var _data = [];
        for (var i=0; i<3; i++) {
            _data.push(
				pdfbeta(x_array, 1+ARMS[2*i+1], 1+ARMS[2*i]-ARMS[2*i+1]) 
			);  
        }
        max_data = d3.max([ 
            10, 
            d3.max(_data[0]),
            d3.max(_data[1]),
            d3.max(_data[2])
		]);
		
		var L1d = _data[0],
			L2d = _data[1],
			L3d = _data[2];
		
		yScale
			.domain([0, max_data]);
		
		// line plot: only UPDATE extant nodes, no enter or exit
		d3.select("#L1p")			
			.datum(L1d)
				.attr({
					"d": pdf_plotter,
				});
		
		d3.select("#L2p")			
			.datum(L2d)
				.attr({
					"d": pdf_plotter,
				});
		
		d3.select("#L3p")			
			.datum(L3d)
				.attr({
					"d": pdf_plotter,
				});
		
		// bar plot: only UPDATE extant nodes, no enter or exit
		plotWin1.selectAll("rect")
			.data(ARMS)
			.attr({
				"class": "bar",
				width: function(d, i) {
					return xScale_bar(d);
				}
			});
		
        //update scoreboard
        var rewards =  ARMS[1] + ARMS[3] + ARMS[5];
        var pulls = ARMS[0] + ARMS[2] + ARMS[4];
        document.getElementById("rewards").innerHTML = rewards ;
        document.getElementById("trials").innerHTML = pulls ;
        document.getElementById("ratio").innerHTML = (rewards/pulls).toFixed(3);
	}
    

	
	
   
        