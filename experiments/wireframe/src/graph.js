var _ = require('underscore');
require('mootools');


/**
 *  An graph representing the underlying 'wireframe' network
 */

var NetworkGraph = new Class({

    initialize : function() {
        this.vertices = [];
        this.edges = [];

    },

    addVertex : function(stop, x, y) {
        if(!x) x = stop.stop_lon;
        if(!y) y = stop.stop_lat;
        var vertex = new Vertex(stop, x, y);
        this.vertices.push(vertex);
        return vertex;
    },

    addEdge : function(stopArray, fromVertex, toVertex) {
        if(!_.contains(this.vertices, fromVertex)) {
            console.log("Error: NetworkGraph does not contain Edge fromVertex")
            return;
        }
        if(!_.contains(this.vertices, toVertex)) {
            console.log("Error: NetworkGraph does not contain Edge toVertex")
            return;
        }
        var edge = new Edge(stopArray, fromVertex, toVertex);
        this.edges.push(edge);
        fromVertex.edges.push(edge);
        toVertex.edges.push(edge);
        return edge;
    },

    getEquivalentEdge : function(stopArray, fromVertex, toVertex) {
        for(var e = 0; e < this.edges.length; e++) {
            var edge = this.edges[e];
            if(edge.fromVertex !== fromVertex || edge.toVertex !== toVertex || stopArray.length !== edge.stopArray.length) continue;
            var matches = 0;
            for(var s = 0; s < stopArray.length; s++) {
                if(stopArray[s] === edge.stopArray[s]) matches++;
            }
            if(matches !== stopArray.length) continue;
            return edge;
        }

        return null;
    },
});

module.exports.NetworkGraph = NetworkGraph;


var Vertex = new Class({

    initialize : function(stop, x, y) {
        this.stop = stop;
        this.x = x;
        this.y = y;
        this.edges = [];
    },

    moveTo : function(x, y) {
        this.x = x;
        this.y = y;
        this.edges.forEach(function(edge) {
            edge.calculateVectors();
        });
    }
});

module.exports.Vertex = Vertex;


var Edge = new Class({

    initialize : function(stopArray, fromVertex, toVertex) {
        this.stopArray = stopArray;
        this.fromVertex = fromVertex;
        this.toVertex = toVertex;

        this.calculateVectors();
    },

    pointAlongEdge : function(t) {
        this.fromVertex.x + t*(this.toVertex.x - this.fromVertex.x);
        var x = this.fromVertex.x + t*(this.toVertex.x - this.fromVertex.x);
        var y = this.fromVertex.y + t*(this.toVertex.y - this.fromVertex.y);
        return { x: x, y: y };
    },

    calculateVectors : function() {
        var dx = this.fromVertex.x - this.toVertex.x;
        var dy = this.fromVertex.y - this.toVertex.y;
        var l = Math.sqrt(dx*dx + dy*dy);
        this.vector = { x: dx/l, y : dy/l };
        this.leftVector = { x : -this.vector.y, y : this.vector.x};
        this.rightVector = { x : this.vector.y, y : -this.vector.x};
    },

    toString : function() {
        return this.fromVertex.stop.getId() + "_" + this.toVertex.stop.getId();
    }

    /*heading : function() {
        var dx = this.fromVertex.x - this.toVertex.x;
        var dy = this.fromVertex.y - this.toVertex.y;
        var l = Math.sqrt(dx*dx + dy*dy);
        return { x: dx/l, y : dy/l };
    },*/   
});

module.exports.Edge = Vertex;