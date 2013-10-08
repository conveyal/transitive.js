var d3 = require('d3');
var _ = require('underscore');
require('mootools');



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

    getId : function() {
        return this.stop_id;
    }
});


/**
 *  A Route Pattern -- a unique sequence of stops
 */

var Pattern = new Class({

    initialize : function(data) {

        _.extend(this, _.omit(data, "stops"));
        this.stops = [];

        // the pattern represented as an ordered sequence of edges in the NetworkGraph
        this.graphEdges = [];

    },


    draw : function(display) {
        // create the pattern as an empty svg group
        this.svgGroup = display.svg.append('g');

        // add the line to the pattern

        this.line = d3.svg.line() // the line translation function
            .x(_.bind(function(vertex, i) {
                
                var xpos = vertex.x; //this.getStopXCoord(stop, i);

                // if first/last element, extend the line slightly
                if(i === 0) x = display.xScale(xpos) - 10;
                else if(i === this.graphEdges.length) x = display.xScale(xpos) + 10;
                else x = display.xScale(xpos);
                return x;

            }, this))
            .y(_.bind(function(vertex, i) { 
                var y = display.yScale(vertex.y);
                return y;
            }, this))
            .interpolate("linear");

        this.lineGraph = this.svgGroup.append("path")
            .attr("class", "line");
        
        // add the stop groups to the pattern
        this.stopSvgGroups = this.svgGroup.selectAll(".stop").data(this.getStopData()).enter().append('g');

        this.stopSvgGroups.append("circle")
            .attr("class", "stop-circle")
            // set up the mouse hover interactivity:
            .on('mouseenter', function(d) {
                d3.select('#stop-label-' + d.stop.getId()).style("visibility", "visible");
            })
            .on('mouseleave', function(d) {
                if(display.zoom.scale() < display.labelZoomThreshold) d3.select('#stop-label-' + d.stop.getId()).style("visibility", "hidden");
            });

        this.stopSvgGroups.append("text")
            .attr("id", function(d) { return "stop-label-" + d.stop.getId(); })
            .text(function(d) { return d.stop.stop_name; })
            .attr("class", "stop-label");

        display.addElement(this);
    },

    refreshZoom : function(display) {
        // update the line and stop groups
        this.lineGraph.attr("d", this.line(this.getGraphVertices()));
        this.stopSvgGroups.attr('transform', _.bind(function(d, i) { 
            var x = display.xScale(d.x);
            var y = display.yScale(d.y);
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

    /**
     *  Returns an array of "stop info" objects, each consisting of the stop x/y coordinates in 
     *  the Display coordinate space, and a reference to the original Stop instance
     */
    getStopData : function() {
        
        var stopData = [];
        
        _.each(this.graphEdges, function(edge, i) {

            // the "from" vertex stop for this edge (first edge only)
            if(i === 0) stopData.push({ x: edge.fromVertex.x, y: edge.fromVertex.y, stop: edge.fromVertex.stop });

            // the internal stops for this edge
            _.each(edge.stopArray, function(stop, i) {
                var stopInfo = edge.pointAlongEdge((i + 1) / (edge.stopArray.length + 1));
                stopInfo.stop = stop;
                stopData.push(stopInfo);
            }, this);

            // the "to" vertex stop for this edge
            stopData.push({ x: edge.toVertex.x, y: edge.toVertex.y, stop: edge.toVertex.stop });
        }, this);
        
        return stopData;
    },

    getGraphVertices : function() {
        var vertices = [];
        _.each(this.graphEdges, function(edge, i) {
            if(i === 0) vertices.push(edge.fromVertex);
            vertices.push(edge.toVertex);
        }, this);
        return vertices;
    }

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

        this.graph = new d3app.graph.NetworkGraph();

        this.loadData(d3app.data.testInput);

        this.display = new Display(600, 400);

        this.pattern = this.patterns["R1_A"];
        this.pattern.draw(this.display);
        this.pattern.applyStyle(d3app.data.style1);
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

        // A list of stops that will become vertices in the network graph. This includes all stops
        // that serve as a pattern endpoint and/or a convergence/divergence point between patterns 
        var vertexStops = {};

        _.each(data.routes, function(routeData) {
            
            // set up the Route object
            var route = new Route(routeData);
            this.routes[route.route_id] = route;

            // iterate through the Route's constituent Patterns
            _.each(routeData.patterns, function(patternData) {

                // set up the Pattern object
                var pattern = new Pattern(patternData);
                this.patterns[patternData.pattern_id] = pattern;
                route.addPattern(pattern);

                _.each(patternData.stops, function(stopInfo) {
                    var stop = this.stops[stopInfo.stop_id];
                    pattern.stops.push(stop);
                    stop.patterns.push(pattern);
                }, this);

                // add the start and end stops to the vertexStops collection
                var firstStop = pattern.stops[0];
                if(!(firstStop.getId() in vertexStops)) vertexStops[firstStop.getId()] = firstStop;

                var lastStop = pattern.stops[pattern.stops.length-1];
                if(!(lastStop.getId() in vertexStops)) vertexStops[lastStop.getId()] = lastStop;

            }, this);

        }, this);



        // populate the graph vertices
        _.each(_.values(vertexStops), function(stop) {
            var vertex = this.graph.addVertex(stop, 0, 0);
            stop.graphVertex = vertex;
        }, this);

        // populate the graph edges
        _.each(_.values(this.patterns), function(pattern) {

            // the vertex associated with the last vertex stop we passed in this sequence 
            var lastVertex = null;
            
            // the collection of 'internal' (i.e. non-vertex) stops passed since the last vertex stop 
            var internalStops = [];
            
            _.each(pattern.stops, function(stop) {
                
                if(stop.graphVertex) { // this is a vertex stop
                    if(lastVertex !== null) {
                        var edge = this.graph.addEdge(internalStops, lastVertex, stop.graphVertex);
                        pattern.graphEdges.push(edge);    
                    }
                    lastVertex = stop.graphVertex;
                    internalStops = [];
                }

                else { // this is an internal stop
                    internalStops.push(stop);
                }

            }, this);
        }, this);
    },

    setStyle: function(style) {
        this.pattern.applyStyle(style);
    }

});

module.exports.App = App;
