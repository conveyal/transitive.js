/**
 * Dependencies
 */

var augment = require('augment');
var each = require('each');
var d3 = require('d3');

var SegmentLabel = require('./segmentlabel');
var Util = require('../util');

var debug = require('debug')('transitive:labeler');

/**
 * Labeler object
 */

var Labeler = augment(Object, function() {

  this.constructor = function(transitive) {

    this.transitive = transitive;
    this.clear();
  };

  this.clear = function(transitive) {

    this.points = [];
  };

  this.updateLabelList = function(graph) {

    this.points = [];
    graph.vertices.forEach(function(vertex) {
      var point = vertex.point;
      if (point.getType() === 'PLACE' || point.getType() === 'MULTI' || (
        point.getType() === 'STOP' && point.isSegmentEndPoint)) {
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

    this.quadtree = d3.geom.quadtree().extent([
      [-this.width, -this.height],
      [this.width * 2, this.height * 2]
    ])([]);

    this.addPointsToQuadtree();
    //this.addSegmentsToQuadtree();
  };

  this.addPointsToQuadtree = function() {

    this.points.forEach(function(point) {
      var mbbox = point.getMarkerBBox();
      if (mbbox) this.addBBoxToQuadtree(point.getMarkerBBox());
    }, this);
  };

  this.addSegmentsToQuadtree = function() {

    var disp = this.transitive.display;
    this.transitive.renderSegments.forEach(function(segment) {

      if (segment.getType() !== 'TRANSIT') return;

      var lw = this.transitive.style.compute(this.transitive.style.segments[
        'stroke-width'], this.transitive.display, segment);
      lw = parseFloat(lw.substring(0, lw.length - 2), 10) - 2;

      var x, x1, x2, y, y1, y2;
      //debug(segment.toString());
      if (segment.renderData.length === 2) { // basic straight segment
        if (segment.renderData[0].x === segment.renderData[1].x) { // vertical
          x = segment.renderData[0].x - lw / 2;
          y1 = segment.renderData[0].y;
          y2 = segment.renderData[1].y;
          this.addBBoxToQuadtree({
            x: x,
            y: Math.min(y1, y2),
            width: lw,
            height: Math.abs(y1 - y2)
          });
        } else if (segment.renderData[0].y === segment.renderData[1].y) { // horizontal
          x1 = segment.renderData[0].x;
          x2 = segment.renderData[1].x;
          y = segment.renderData[0].y - lw / 2;
          this.addBBoxToQuadtree({
            x: Math.min(x1, x2),
            y: y,
            width: Math.abs(x1 - x2),
            height: lw
          });
        }
      }

      if (segment.renderData.length === 4) { // basic curved segment

        if (segment.renderData[0].x === segment.renderData[1].x) { // vertical first
          x = segment.renderData[0].x - lw / 2;
          y1 = segment.renderData[0].y;
          y2 = segment.renderData[3].y;
          this.addBBoxToQuadtree({
            x: x,
            y: Math.min(y1, y2),
            width: lw,
            height: Math.abs(y1 - y2)
          });

          x1 = segment.renderData[0].x;
          x2 = segment.renderData[3].x;
          y = segment.renderData[3].y - lw / 2;
          this.addBBoxToQuadtree({
            x: Math.min(x1, x2),
            y: y,
            width: Math.abs(x1 - x2),
            height: lw
          });

        } else if (segment.renderData[0].y === segment.renderData[1].y) { // horiz first
          x1 = segment.renderData[0].x;
          x2 = segment.renderData[3].x;
          y = segment.renderData[0].y - lw / 2;
          this.addBBoxToQuadtree({
            x: Math.min(x1, x2),
            y: y,
            width: Math.abs(x1 - x2),
            height: lw
          });

          x = segment.renderData[3].x - lw / 2;
          y1 = segment.renderData[0].y;
          y2 = segment.renderData[3].y;
          this.addBBoxToQuadtree({
            x: x,
            y: Math.min(y1, y2),
            width: lw,
            height: Math.abs(y1 - y2)
          });
        }
      }

    }, this);
  };

  this.addBBoxToQuadtree = function(bbox) {

    if (bbox.x + bbox.width / 2 < 0 || bbox.x - bbox.width / 2 > this.width ||
      bbox.y + bbox.height / 2 < 0 || bbox.y - bbox.height / 2 > this.height
    ) return;

    this.quadtree.add([bbox.x + bbox.width / 2, bbox.y + bbox.height / 2,
      bbox
    ]);

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

    each(this.segmentLabels, function(label) {
      label.clear();
    });
    this.segmentLabels = [];
    this.placedLabelKeys = [];

    // collect the bus RenderSegments
    var busRSegments = [];
    each(this.transitive.network.paths, function(path) {
      each(path.getRenderedSegments(), function(rSegment) {
        if (rSegment.type === 'TRANSIT' && rSegment.mode === 3)
          busRSegments.push(rSegment);
      });
    }, this);

    var edgeGroups = [];
    each(this.transitive.network.paths, function(path) {
      each(path.segments, function(segment) {
        if (segment.type === 'TRANSIT' && segment.getMode() === 3) {
          edgeGroups = edgeGroups.concat(segment.getLabelEdgeGroups());
        }
      });
    }, this);

    // iterate through the sequence collection, labeling as necessary
    //each(busRSegments, function(rSegment) {
    each(edgeGroups, function(edgeGroup) {

      this.currentGroup = edgeGroup;
      // get the array of label strings to be places (typically the unique route short names)
      this.labelTextArray = edgeGroup.getLabelTextArray();

      // create the initial label for placement
      this.labelTextIndex = 0;

      var label = this.getNextLabel(); //this.constructSegmentLabel(rSegment, labelTextArray[labelTextIndex]);
      if (!label) return;

      // iterate through potential anchor locations, attempting placement at each one
      var labelAnchors = edgeGroup.getLabelAnchors(this.transitive.display,
        label.textHeight * 1.5);
      for (var i = 0; i < labelAnchors.length; i++) {
        label.labelAnchor = labelAnchors[i];

        // do not consider this anchor if it is out of the display range
        if (!this.transitive.display.isInRange(label.labelAnchor.x,
          label.labelAnchor.y)) continue;

        // check for conflicts with existing placed elements
        var bbox = label.getBBox();
        var conflicts = this.findOverlaps(label, bbox);

        if (conflicts.length === 0) { // if no conflicts

          // place the current label
          this.segmentLabels.push(label);
          this.quadtree.add([label.labelAnchor.x, label.labelAnchor.y,
            label
          ]);
          //debug('placing seg label for ' + label.labelText);

          label = this.getNextLabel();
          if (!label) break;

        }
      } // end of anchor iteration loop
    }, this); // end of sequence iteration loop
  };

  this.getNextLabel = function() {
    while (this.labelTextIndex < this.labelTextArray.length) {
      var labelText = this.labelTextArray[this.labelTextIndex];
      var key = this.currentGroup.edgeIds + '_' + labelText;
      if (this.placedLabelKeys.indexOf(key) !== -1) {
        this.labelTextIndex++;
        continue;
      }
      var label = this.constructSegmentLabel(this.currentGroup.renderedSegment,
        labelText);
      this.placedLabelKeys.push(key);
      this.labelTextIndex++;
      return label;
    }
    return null;
  };

  this.constructSegmentLabel = function(segment, labelText) {
    var label = new SegmentLabel(segment, labelText);
    var styler = this.transitive.styler;
    label.fontFamily = styler.compute(styler.labels[
      'font-family'], this.transitive.display, {
      segment: segment
    });
    label.fontSize = styler.compute(styler.labels['font-size'],
      this.transitive.display, {
        segment: segment
      });
    var textBBox = Util.getTextBBox(labelText, {
      'font-size': label.fontSize,
      'font-family': label.fontFamily,
    });
    label.textWidth = textBBox.width;
    label.textHeight = textBBox.height;
    label.computeContainerDimensions();

    return label;
  };

  this.placePointLabels = function() {

    var styler = this.transitive.styler;

    var labeledPoints = [];

    this.points.forEach(function(point) {

      var labelText = point.label.getText();
      point.label.fontFamily = styler.compute(styler.labels['font-family'],
        this.transitive
        .display, {
          point: point
        });
      point.label.fontSize = styler.compute(styler.labels['font-size'],
        this.transitive
        .display, {
          point: point
        });
      var textBBox = Util.getTextBBox(labelText, {
        'font-size': point.label.fontSize,
        'font-family': point.label.fontFamily,
      });
      point.label.textWidth = textBBox.width;
      point.label.textHeight = textBBox.height;

      var orientations = styler.compute(styler.labels.orientations, this.transitive
        .display, {
          point: point
        });

      var placedLabel = false;
      for (var i = 0; i < orientations.length; i++) {

        point.label.setOrientation(orientations[i]);
        if (!point.focused) continue;

        if (!point.label.labelAnchor) continue;

        var lx = point.label.labelAnchor.x,
          ly = point.label.labelAnchor.y;

        // do not place label if out of range
        if (lx <= 0 || ly <= 0 || lx >= this.width || ly > this.height)
          continue;

        var labelBBox = point.label.getBBox();

        var overlaps = this.findOverlaps(point.label, labelBBox);

        // do not place label if it overlaps with others
        if (overlaps.length > 0) continue;

        // if we reach this point, the label is good to place

        point.label.setVisibility(true);
        labeledPoints.push(point);

        this.quadtree.add([labelBBox.x + labelBBox.width / 2, labelBBox.y +
          labelBBox.height / 2, point.label
        ]);

        this.maxBBoxWidth = Math.max(this.maxBBoxWidth, labelBBox.width);
        this.maxBBoxHeight = Math.max(this.maxBBoxHeight, labelBBox.height);

        placedLabel = true;
        break; // do not consider any other orientations after places

      } // end of orientation loop

      // if label not placed at all, hide the element
      if (!placedLabel) {
        point.label.setVisibility(false);
      }

    }, this);
    return labeledPoints;
  };

  this.findOverlaps = function(label, labelBBox) {
    var minX = labelBBox.x - this.maxBBoxWidth / 2;
    var minY = labelBBox.y - this.maxBBoxHeight / 2;
    var maxX = labelBBox.x + labelBBox.width + this.maxBBoxWidth / 2;
    var maxY = labelBBox.y + labelBBox.height + this.maxBBoxHeight / 2;
    //debug('findOverlaps %s,%s %s,%s', minX,minY,maxX,maxY);

    var matchItems = [];
    this.quadtree.visit(function(node, x1, y1, x2, y2) {
      var p = node.point;
      if ((p) && (p[0] >= minX) && (p[0] < maxX) && (p[1] >= minY) && (p[
        1] < maxY) && label.intersects(p[2])) {
        matchItems.push(p[2]);
      }
      return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY;
    });
    return matchItems;
  };

  this.findNearbySegmentLabels = function(label, x, y, buffer) {
    var minX = x - buffer;
    var minY = y - buffer;
    var maxX = x + buffer;
    var maxY = y + buffer;
    //debug('findNearby %s,%s %s,%s', minX,minY,maxX,maxY);

    var matchItems = [];
    this.quadtree.visit(function(node, x1, y1, x2, y2) {
      var p = node.point;
      if ((p) && (p[0] >= minX) && (p[0] < maxX) && (p[1] >= minY) && (p[
        1] < maxY) && (p[2].parent) && (label.parent.patternIds === p[2]
        .parent.patternIds)) {
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
