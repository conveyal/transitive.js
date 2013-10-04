var d3 = require('d3');
var _ = require('underscore');
require('mootools');


var testInput = {
    "agency" : 
    {   
        "agency_id" : "ABC",
        "agency_name" : "ABC Transit",
        "agency_timezone" : "America/New_York"
    },
 
    "routes" :
    [
        {
            "route_id" : "R1",
            "route_short_name" :"1",
            "route_long_name" :"Main St",
            "route_type": 3,
            "route_color" : "blue",
            "route_text_color" : "white",
 
            "patterns" :
            [
                {
                    "pattern_id" : "R1_A",
                    "pattern_name" : "Eastbound",
                    "direction_id" : 0,

                    "stops" :
                    [
                        {
                            "stop_id" : "S1",
                            "stop_index" : 1
                        },
                        {
                            "stop_id" : "S2",
                            "stop_index" : 2
                        },
                        {
                            "stop_id" : "S3",
                            "stop_index" : 3
                        },
                        {
                            "stop_id" : "S4",
                            "stop_index" : 4
                        }
                    ]
                }
            ]        
        }
    ],
 
    "stops":
    [
        {
            "stop_id" : "S1",
            "stop_name" : "1st St",
            "location_type" : 0,
 
            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        },
        {
            "stop_id" : "S2",
            "stop_name" : "2nd St",
            "location_type" : 0,
 
            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        },
        {
            "stop_id" : "S3",
            "stop_name" : "3rd St",
            "location_type" : 0,
 
            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        },
        {
            "stop_id" : "S4",
            "stop_name" : "4th St",
            "location_type" : 0,
 
            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        }
    ]
};


var style1 = {
    className: 'style1',

    stopRadius: 5,
    stopOffsetX: 0,
    stopOffsetY: 0,

    labelOffsetX: 0,
    labelOffsetY: -12,
    labelRotation: -45,
};

module.exports.style1 = style1;


var style2 = {
    className: 'style2',

    stopRadius: 6,
    stopOffsetX: 0,
    stopOffsetY: 0,

    labelOffsetX: -5,
    labelOffsetY: 15,
    labelRotation: 45,
};

module.exports.style2 = style2;


var style3 = {
    className: 'style3',

    stopRadius: 7,
    stopOffsetX: 0,
    stopOffsetY: -6,

    labelOffsetX: 0,
    labelOffsetY: -16,
    labelRotation: -45,
};

module.exports.style3 = style3;

/**
 *  A transit Route, as defined in the input data. Routes contain one or more Patterns
 */

var Route = new Class({

    initialize : function(data) {
        _.extend(this, _.omit(data, "patterns"));
        this.patterns = [];
    },

    addPattern: function(pattern) {
        this.patterns.push(pattern);
        pattern.route = this;
    }
});


/**
 *  A transit Stop, as defined in the input data. Stops are shared between Patterns
 */

var Stop = new Class({

    initialize : function(data) {
        _.extend(this, _.omit(data, "patterns"));
        this.patterns = [];
    },
});


/**
 *  A Route Pattern -- a unique sequence of stops
 */

var Pattern = new Class({

    initialize : function(data) {

        _.extend(this, _.omit(data, "stops"));
        this.stops = [];

        // for now, the pattern as rendered as a straight line between (-1, 0) and (1, 0)
        // in the Display coordinate space. This can eventually be replaced by a more
        // sophisticated graph-based representation of underlying vertices and edges

        this.x1 = -1, this.y1 = 0;
        this.x2 = 1, this.y2 = 0;

    },


    draw : function(display) {
        // create the pattern as an empty svg group
        this.svgGroup = display.svg.append('g');

        // add the line to the pattern

        this.line = d3.svg.line() // the line translation function
            .x(_.bind(function(stop, i) {
                
                var xpos = this.getStopXCoord(stop, i);

                // if first/last element, extend the line slightly
                if(i === 0) x = display.xScale(xpos) - 10;
                else if(i === this.stops.length - 1) x = display.xScale(xpos) + 10;
                else x = display.xScale(xpos);
                return x;

            }, this))
            .y(_.bind(function(stop, i) { 
                var y = display.yScale(this.getStopYCoord(stop, i));
                return y;
            }, this))
            .interpolate("linear");

        this.lineGraph = this.svgGroup.append("path")
            .attr("class", "line");
        
        // add the stop groups to the pattern
        this.stopSvgGroups = this.svgGroup.selectAll(".stop").data(this.stops).enter().append('g');

        this.stopSvgGroups.append("circle")
            .attr("class", "stop-circle")
            // set up the mouse hover interactivity:
            .on('mouseenter', function(d) {
                d3.select('#stop-label-' + d.id).style("visibility", "visible");
            })
            .on('mouseleave', function(d) {
                if(display.zoom.scale() < display.labelZoomThreshold) d3.select('#stop-label-' + d.id).style("visibility", "hidden");
            });

        this.stopSvgGroups.append("text")
            .attr("id", function(d) { return "stop-label-" + d.stop_id; })
            .text(function(d) { return d.stop_name; })
            .attr("class", "stop-label");

        display.addElement(this);
    },

    refreshZoom : function(display) {
        // update the line and stop groups
        this.lineGraph.attr("d", this.line(this.stops));
        this.stopSvgGroups.attr('transform', _.bind(function(stop, i) { 
            var x = display.xScale(this.getStopXCoord(stop, i));
            var y = display.yScale(this.getStopYCoord(stop, i));
            return 'translate(' + x +', ' + y +')';
        }, this));

        // hide/show the stop labels if needed
        if(display.zoom.scale() < display.labelZoomThreshold) {
            d3.selectAll('.stop-label').style('visibility', 'hidden');
        }
        else {
            d3.selectAll('.stop-label').style('visibility', 'visible');            
        }
    },

    applyStyle: function(style) {
        this.svgGroup.attr('class', style.className);

        this.svgGroup.selectAll('.stop-circle')
            .attr("cx", style.stopOffsetX)
            .attr("cy", style.stopOffsetY)
            .attr("r", style.stopRadius);

        this.svgGroup.selectAll('.stop-label')
            .attr("x", style.labelOffsetX).attr("y", style.labelOffsetY)
            .attr('transform', 'rotate(' + style.labelRotation + ', ' + style.labelOffsetX + ', ' + style.labelOffsetY + ')');
    },

    getStopXCoord : function(stop, i) {
        return this.x1 + (i/(this.stops.length-1))*(this.x2 - this.x1);
    },


    getStopYCoord : function(stop, i) {
        return this.y1 + (i/(this.stops.length-1))*(this.y2 - this.y1);
    },

});


/**
 *  The D3-based SVG display. 
 */

var Display = new Class({

    initialize : function(width, height) {

        this.displayedElements = [];

        _.bindAll(this, "zoomed");

        this.width = width, this.height = height;
        this.y = 0;//this.height/2; // center the line map vertically in the svg canvas

        this.xScale = d3.scale.linear()
            .domain([-2, 2]) //[0, this.width])
            .range([0, this.width]);

        this.yScale = d3.scale.linear()
            .domain([-2, 2]) //[0, this.height])
            .range([this.height, 0]);

        // set up the pan/zoom behavior
        this.zoom  = d3.behavior.zoom()
            .x(this.xScale).y(this.yScale)
            .scaleExtent([.25, 4])
            .on("zoom", this.zoomed);

        this.labelZoomThreshold = .75;

        // set up the svg display
        this.svg = d3.select("body").append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
          .append("g")
            .call(this.zoom);

        // append an overlay to capture pan/zoom events on entire viewport
        this.svg.append("rect")
            .attr("class", "overlay")
            .attr("width", this.width)
            .attr("height", this.height);
    },

    addElement: function(element) {
        this.displayedElements.push(element);
    },

    zoomed: function() {
        _.each(this.displayedElements, function(element) {
            element.refreshZoom(this);
        }, this);
    }

});


/**
 *  The main class
 */

var App = new Class({

    initialize : function() {

        this.loadData(testInput);

        this.display = new Display(600, 400);

        this.pattern = this.patterns["R1_A"];
        this.pattern.draw(this.display);
        this.pattern.applyStyle(style1);
        this.pattern.refreshZoom(this.display);

    },

    loadData: function(data) {
        
        this.stops = {};
        _.each(data.stops, function(stopData) {
            var stop = new Stop(stopData);
            this.stops[stop.stop_id] = stop;
        }, this);

        this.routes = {};
        this.patterns = {};
        _.each(data.routes, function(routeData) {
            var route = new Route(routeData);
            this.routes[route.route_id] = route;
            _.each(routeData.patterns, function(patternData) {
                var pattern = new Pattern(patternData);
                this.patterns[patternData.pattern_id] = pattern;
                route.addPattern(pattern);

                _.each(patternData.stops, function(stopInfo) {
                    var stop = this.stops[stopInfo.stop_id];
                    pattern.stops.push(stop);
                    stop.patterns.push(pattern);
                }, this);
            }, this);

        }, this);


    },

    setStyle: function(style) {
        this.pattern.applyStyle(style);
    }

});

module.exports.App = App;
