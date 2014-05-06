
/**
 * Dependencies
 */

var augment = require('augment');
var d3 = require('d3');

var Util = require('../util');


/**
 * Labeler object
 */

var Labeler = augment(Object, function () {

  this.constructor = function(transitive) {

    this.transitive = transitive;
    this.points = [];

  };


  this.updateLabelList = function() {

    this.points = [];
    this.transitive.graph.vertices.forEach(function(vertex) {
      //console.log('- ' + vertex.point.getName());
      var point = vertex.point;
      if(point.getType() === 'PLACE' || point.getType() === 'MULTI' || (point.getType() === 'STOP' && point.isSegmentEndPoint)) {
        this.points.push(point);
      }
    }, this);

    this.points.sort(function compare(a, b) {
      if (a.containsFromPoint() || a.containsToPoint()) return -1;
      if (b.containsFromPoint() || b.containsToPoint()) return 1;
      return 0;
    });
  };


  this.updateQuadtree = function() {

    this.quadtree = d3.geom.quadtree().extent([[-this.width, -this.height], [this.width*2, this.height*2]])([]);

    this.points.forEach(function(point) {
      this.addBBoxToQuadtree(point.getMarkerBBox());
    }, this);

    var disp = this.transitive.display;
    this.transitive.renderSegments.forEach(function(segment) {

      if(segment.getType() !== 'TRANSIT') return;

      var lw = this.transitive.style.compute(this.transitive.style.segments['stroke-width'], this.transitive.display, segment);
      lw = parseFloat(lw.substring(0, lw.length - 2), 10) - 2;

      var x, x1, x2, y, y1, y2;
      if(segment.renderData.length === 2) { // basic straight segment
        if(segment.renderData[0].x === segment.renderData[1].x) { // vertical
          x = disp.xScale(segment.renderData[0].x) + segment.renderData[0].offsetX - lw / 2;
          y1 = disp.yScale(segment.renderData[0].y);
          y2 = disp.yScale(segment.renderData[1].y);
          this.addBBoxToQuadtree({
            x : x,
            y : Math.min(y1, y2),
            width : lw,
            height: Math.abs(y1 - y2)
          });
        }
        else if(segment.renderData[0].y === segment.renderData[1].y) { // horizontal
          x1 = disp.xScale(segment.renderData[0].x);
          x2 = disp.xScale(segment.renderData[1].x);
          y = disp.yScale(segment.renderData[0].y) - segment.renderData[0].offsetY - lw / 2;
          this.addBBoxToQuadtree({
            x : Math.min(x1, x2),
            y : y,
            width : Math.abs(x1 - x2),
            height: lw
          });
        }
      }

      if(segment.renderData.length === 4) { // basic curved segment

        if(segment.renderData[0].x === segment.renderData[1].x) { // vertical first
          x = disp.xScale(segment.renderData[0].x) + segment.renderData[0].offsetX - lw / 2;
          y1 = disp.yScale(segment.renderData[0].y);
          y2 = disp.yScale(segment.renderData[3].y);
          this.addBBoxToQuadtree({
            x : x,
            y : Math.min(y1, y2),
            width : lw,
            height: Math.abs(y1 - y2)
          });

          x1 = disp.xScale(segment.renderData[0].x);
          x2 = disp.xScale(segment.renderData[3].x);
          y = disp.yScale(segment.renderData[3].y) - segment.renderData[3].offsetY - lw / 2;
          this.addBBoxToQuadtree({
            x : Math.min(x1, x2),
            y : y,
            width : Math.abs(x1 - x2),
            height: lw
          });

        }
        else if(segment.renderData[0].y === segment.renderData[1].y) { // horiz first
          x1 = disp.xScale(segment.renderData[0].x);
          x2 = disp.xScale(segment.renderData[3].x);
          y = disp.yScale(segment.renderData[0].y) - segment.renderData[0].offsetY - lw / 2;
          this.addBBoxToQuadtree({
            x : Math.min(x1, x2),
            y : y,
            width : Math.abs(x1 - x2),
            height: lw
          });

          x = disp.xScale(segment.renderData[3].x) + segment.renderData[3].offsetX - lw / 2;
          y1 = disp.yScale(segment.renderData[0].y);
          y2 = disp.yScale(segment.renderData[3].y);
          this.addBBoxToQuadtree({
            x : x,
            y : Math.min(y1, y2),
            width : lw,
            height: Math.abs(y1 - y2)
          });
        }
      }

    }, this);
  };

  this.addBBoxToQuadtree = function(bbox) {
    //console.log(bbox);
    this.quadtree.add([bbox.x + bbox.width/2, bbox.y + bbox.height/2, bbox]);

    this.maxBBoxWidth = Math.max(this.maxBBoxWidth, bbox.width);
    this.maxBBoxHeight = Math.max(this.maxBBoxHeight, bbox.height);
  };


  this.doLayout = function() {

    this.width = this.transitive.el.clientWidth;
    this.height = this.transitive.el.clientHeight;

    this.maxBBoxWidth = 0;
    this.maxBBoxHeight = 0;

    this.updateQuadtree();

    var labeledSegments = this.placeSegmentLabels();
    var labeledPoints = this.placePointLabels();
    
    return {
      segments: labeledSegments,
      points: labeledPoints
    };
  };


  this.placeSegmentLabels = function() {

    var styler = this.transitive.style;

    var labeledSegments = [];

    this.transitive.renderSegments.forEach(function(segment) {
      if(segment.getType() === 'TRANSIT' && segment.pattern.route.route_type === 3) {
  
        var labelText = segment.label.getText();
        var fontFamily = styler.compute(styler.segment_labels['font-family'], this.transitive.display, {segment: segment});
        var fontSize = styler.compute(styler.segment_labels['font-size'], this.transitive.display, {segment: segment});
        var textBBox = Util.getTextBBox(labelText, {
          'font-size' : fontSize,
          'font-family' : fontFamily,
        });
        segment.label.textWidth = textBBox.width;
        segment.label.textHeight = textBBox.height;
        var labelAnchors = segment.getLabelAnchors(this.transitive.display);
        segment.label.labelAnchor = labelAnchors[0]; /*{
          x : this.transitive.display.xScale(segment.renderData[0].x) + segment.renderData[0].offsetX,
          y : this.transitive.display.yScale(segment.renderData[0].y) - segment.renderData[0].offsetY
        };*/

        labeledSegments.push(segment);

        this.quadtree.add([segment.label.labelAnchor.x, segment.label.labelAnchor.y, segment.label]);

      }
    }, this);

    return labeledSegments;
  };


  this.placePointLabels = function() {

    var styler = this.transitive.style;

    var labeledPoints = [];

    this.points.forEach(function(point) {

      var labelText = point.label.getText();
      var fontFamily = styler.compute(styler.labels['font-family'], this.transitive.display, {point: point});
      var fontSize = styler.compute(styler.labels['font-size'], this.transitive.display, {point: point});
      var textBBox = Util.getTextBBox(labelText, {
        'font-size' : fontSize,
        'font-family' : fontFamily,
      });
      point.label.textWidth = textBBox.width;
      point.label.textHeight = textBBox.height;

      var orientations = ['E', 'W', 'NE', 'SE', 'NW', 'SW', 'N', 'S'];

      var placedLabel = false;
      for(var i = 0; i < orientations.length; i++) {
        
        point.label.setOrientation(orientations[i]);
        if(!point.focused) continue;
        
        if(!point.label.labelAnchor) continue;

        var lx = point.label.labelAnchor.x, ly = point.label.labelAnchor.y;

        // do not place label if out of range
        if(lx <= 0 || ly <= 0 || lx >= this.width || ly > this.height) continue;
        

        var labelBBox = point.label.getBBox();

        var overlaps = this.findOverlaps(point.label, labelBBox);

        // do not place label if it overlaps with others
        if(overlaps.length > 0) continue;

        // if we reach this point, the label is good to place

        point.label.setVisibility(true);
        labeledPoints.push(point);

        this.quadtree.add([labelBBox.x + labelBBox.width/2, labelBBox.y + labelBBox.height/2, point.label]);

        this.maxBBoxWidth = Math.max(this.maxBBoxWidth, labelBBox.width);
        this.maxBBoxHeight = Math.max(this.maxBBoxHeight, labelBBox.height);

        placedLabel = true;
        break; // do not consider any other orientations after places

      } // end of orientation loop

      // if label not placed at all, hide the element
      if(!placedLabel) {
        point.label.setVisibility(false);
      }

    }, this);
    return labeledPoints;
  };

  this.findOverlaps = function(label, labelBBox) {
    var minX = labelBBox.x - this.maxBBoxWidth/2;
    var minY = labelBBox.y - this.maxBBoxHeight/2;
    var maxX = labelBBox.x + labelBBox.width + this.maxBBoxWidth/2;
    var maxY = labelBBox.y + labelBBox.height + this.maxBBoxHeight/2;

    var matchItems = [];
    this.quadtree.visit(function(node, x1, y1, x2, y2) {
      var p = node.point;
      if((p) && (p[0] >= minX) && (p[0] < maxX) && (p[1] >= minY) && (p[1] < maxY) && label.intersects(p[2])) {
        matchItems.push(p[2]);
      }
      return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY;
    });
    return matchItems;
  };

});


/**
 * Expose `Labeler`
 */

module.exports = Labeler;