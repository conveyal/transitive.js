'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _measureText = require('measure-text');

var _measureText2 = _interopRequireDefault(_measureText);

var _d = require('d3');

var _d2 = _interopRequireDefault(_d);

var _segmentlabel = require('./segmentlabel');

var _segmentlabel2 = _interopRequireDefault(_segmentlabel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Labeler object
 */

var Labeler = function () {
  function Labeler(transitive) {
    (0, _classCallCheck3.default)(this, Labeler);

    this.transitive = transitive;
    this.clear();
  }

  (0, _createClass3.default)(Labeler, [{
    key: 'clear',
    value: function clear(transitive) {
      this.points = [];
    }
  }, {
    key: 'updateLabelList',
    value: function updateLabelList(graph) {
      var _this = this;

      this.points = [];
      (0, _lodash.forEach)(graph.vertices, function (vertex) {
        var point = vertex.point;
        if (point.getType() === 'PLACE' || point.getType() === 'MULTI' || point.getType() === 'STOP' && point.isSegmentEndPoint) {
          _this.points.push(point);
        }
      });

      this.points.sort(function (a, b) {
        if (a.containsFromPoint() || a.containsToPoint()) return -1;
        if (b.containsFromPoint() || b.containsToPoint()) return 1;
        return 0;
      });
    }
  }, {
    key: 'updateQuadtree',
    value: function updateQuadtree() {
      this.quadtree = _d2.default.geom.quadtree().extent([[-this.width, -this.height], [this.width * 2, this.height * 2]])([]);

      this.addPointsToQuadtree();
      // this.addSegmentsToQuadtree();
    }
  }, {
    key: 'addPointsToQuadtree',
    value: function addPointsToQuadtree() {
      var _this2 = this;

      (0, _lodash.forEach)(this.points, function (point) {
        var mbbox = point.getMarkerBBox();
        if (mbbox) _this2.addBBoxToQuadtree(point.getMarkerBBox());
      });
    }
  }, {
    key: 'addSegmentsToQuadtree',
    value: function addSegmentsToQuadtree() {
      var _this3 = this;

      (0, _lodash.forEach)(this.transitive.renderSegments, function (segment) {
        if (segment.getType() !== 'TRANSIT') return;

        var lw = _this3.transitive.style.compute(_this3.transitive.style.segments['stroke-width'], _this3.transitive.display, segment);
        lw = parseFloat(lw.substring(0, lw.length - 2), 10) - 2;

        var x, x1, x2, y, y1, y2;
        // debug(segment.toString());
        if (segment.renderData.length === 2) {
          // basic straight segment
          if (segment.renderData[0].x === segment.renderData[1].x) {
            // vertical
            x = segment.renderData[0].x - lw / 2;
            y1 = segment.renderData[0].y;
            y2 = segment.renderData[1].y;
            _this3.addBBoxToQuadtree({
              x: x,
              y: Math.min(y1, y2),
              width: lw,
              height: Math.abs(y1 - y2)
            });
          } else if (segment.renderData[0].y === segment.renderData[1].y) {
            // horizontal
            x1 = segment.renderData[0].x;
            x2 = segment.renderData[1].x;
            y = segment.renderData[0].y - lw / 2;
            _this3.addBBoxToQuadtree({
              x: Math.min(x1, x2),
              y: y,
              width: Math.abs(x1 - x2),
              height: lw
            });
          }
        }

        if (segment.renderData.length === 4) {
          // basic curved segment
          if (segment.renderData[0].x === segment.renderData[1].x) {
            // vertical first
            x = segment.renderData[0].x - lw / 2;
            y1 = segment.renderData[0].y;
            y2 = segment.renderData[3].y;
            _this3.addBBoxToQuadtree({
              x: x,
              y: Math.min(y1, y2),
              width: lw,
              height: Math.abs(y1 - y2)
            });

            x1 = segment.renderData[0].x;
            x2 = segment.renderData[3].x;
            y = segment.renderData[3].y - lw / 2;
            _this3.addBBoxToQuadtree({
              x: Math.min(x1, x2),
              y: y,
              width: Math.abs(x1 - x2),
              height: lw
            });
          } else if (segment.renderData[0].y === segment.renderData[1].y) {
            // horiz first
            x1 = segment.renderData[0].x;
            x2 = segment.renderData[3].x;
            y = segment.renderData[0].y - lw / 2;
            _this3.addBBoxToQuadtree({
              x: Math.min(x1, x2),
              y: y,
              width: Math.abs(x1 - x2),
              height: lw
            });

            x = segment.renderData[3].x - lw / 2;
            y1 = segment.renderData[0].y;
            y2 = segment.renderData[3].y;
            _this3.addBBoxToQuadtree({
              x: x,
              y: Math.min(y1, y2),
              width: lw,
              height: Math.abs(y1 - y2)
            });
          }
        }
      });
    }
  }, {
    key: 'addBBoxToQuadtree',
    value: function addBBoxToQuadtree(bbox) {
      if (bbox.x + bbox.width / 2 < 0 || bbox.x - bbox.width / 2 > this.width || bbox.y + bbox.height / 2 < 0 || bbox.y - bbox.height / 2 > this.height) return;

      this.quadtree.add([bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, bbox]);

      this.maxBBoxWidth = Math.max(this.maxBBoxWidth, bbox.width);
      this.maxBBoxHeight = Math.max(this.maxBBoxHeight, bbox.height);
    }
  }, {
    key: 'doLayout',
    value: function doLayout() {
      this.width = this.transitive.display.width;
      this.height = this.transitive.display.height;

      this.maxBBoxWidth = 0;
      this.maxBBoxHeight = 0;

      this.updateQuadtree();

      return {
        pointLabels: this.placePointLabels(),
        segmentLabels: this.placeSegmentLabels()
      };
    }

    /** placePointLabels **/

  }, {
    key: 'placePointLabels',
    value: function placePointLabels() {
      var _this4 = this;

      var styler = this.transitive.styler;

      var placedLabels = [];
      //var labeledPoints = []

      (0, _lodash.forEach)(this.points, function (point) {
        var labelText = point.label.getText();
        if (!labelText) return;
        point.label.fontFamily = styler.compute2('labels', 'font-family', point);
        point.label.fontSize = styler.compute2('labels', 'font-size', point);
        var textDimensions = (0, _measureText2.default)({
          text: labelText,
          fontSize: point.label.fontSize,
          fontFamily: point.label.fontFamily || 'sans-serif',
          lineHeight: 1.2
        });
        point.label.textWidth = textDimensions.width.value;
        point.label.textHeight = textDimensions.height.value;

        var orientations = styler.compute(styler.labels.orientations, _this4.transitive.display, {
          point: point
        });

        var placedLabel = false;
        for (var i = 0; i < orientations.length; i++) {
          point.label.setOrientation(orientations[i]);
          if (!point.focused) continue;

          if (!point.label.labelAnchor) continue;

          var lx = point.label.labelAnchor.x;
          var ly = point.label.labelAnchor.y;

          // do not place label if out of range
          if (lx <= 0 || ly <= 0 || lx >= _this4.width || ly > _this4.height) continue;

          var labelBBox = point.label.getBBox();

          var overlaps = _this4.findOverlaps(point.label, labelBBox);

          // do not place label if it overlaps with others
          if (overlaps.length > 0) continue;

          // if we reach this point, the label is good to place

          point.label.setVisibility(true);
          //labeledPoints.push(point)
          placedLabels.push(point.label);

          _this4.quadtree.add([labelBBox.x + labelBBox.width / 2, labelBBox.y + labelBBox.height / 2, point.label]);

          _this4.maxBBoxWidth = Math.max(_this4.maxBBoxWidth, labelBBox.width);
          _this4.maxBBoxHeight = Math.max(_this4.maxBBoxHeight, labelBBox.height);

          placedLabel = true;
          break; // do not consider any other orientations after places
        } // end of orientation loop

        // if label not placed at all, hide the element
        if (!placedLabel) {
          point.label.setVisibility(false);
        }
      });

      return placedLabels;
    }

    /** placeSegmentLabels **/

  }, {
    key: 'placeSegmentLabels',
    value: function placeSegmentLabels() {
      var _this5 = this;

      this.placedLabelKeys = [];
      var placedLabels = [];

      // collect the bus RenderSegments
      var busRSegments = [];
      (0, _lodash.forEach)(this.transitive.network.paths, function (path) {
        (0, _lodash.forEach)(path.getRenderedSegments(), function (rSegment) {
          if (rSegment.type === 'TRANSIT' && rSegment.mode === 3) busRSegments.push(rSegment);
        });
      });

      var edgeGroups = [];
      (0, _lodash.forEach)(this.transitive.network.paths, function (path) {
        (0, _lodash.forEach)(path.segments, function (segment) {
          if (segment.type === 'TRANSIT' && segment.getMode() === 3) {
            edgeGroups = edgeGroups.concat(segment.getLabelEdgeGroups());
          }
        });
      });

      // iterate through the sequence collection, labeling as necessary
      (0, _lodash.forEach)(edgeGroups, function (edgeGroup) {
        _this5.currentGroup = edgeGroup;
        // get the array of label strings to be places (typically the unique route short names)
        _this5.labelTextArray = edgeGroup.getLabelTextArray();

        // create the initial label for placement
        _this5.labelTextIndex = 0;

        var label = _this5.getNextLabel(); // this.constructSegmentLabel(rSegment, labelTextArray[labelTextIndex]);
        if (!label) return;

        // iterate through potential anchor locations, attempting placement at each one
        var labelAnchors = edgeGroup.getLabelAnchors(_this5.transitive.display, label.textHeight * 1.5);
        for (var i = 0; i < labelAnchors.length; i++) {
          label.labelAnchor = labelAnchors[i];

          // do not consider this anchor if it is out of the display range
          if (!_this5.transitive.display.isInRange(label.labelAnchor.x, label.labelAnchor.y)) continue;

          // check for conflicts with existing placed elements
          var bbox = label.getBBox();
          var conflicts = _this5.findOverlaps(label, bbox);

          if (conflicts.length === 0) {
            // if no conflicts
            // place the current label
            placedLabels.push(label);
            _this5.quadtree.add([label.labelAnchor.x, label.labelAnchor.y, label]);
            label = _this5.getNextLabel();
            if (!label) break;
          }
        } // end of anchor iteration loop
      }); // end of sequence iteration loop
      return placedLabels;
    }
  }, {
    key: 'getNextLabel',
    value: function getNextLabel() {
      while (this.labelTextIndex < this.labelTextArray.length) {
        var labelText = this.labelTextArray[this.labelTextIndex];
        var key = this.currentGroup.edgeIds + '_' + labelText;
        if (this.placedLabelKeys.indexOf(key) !== -1) {
          this.labelTextIndex++;
          continue;
        }
        var label = this.constructSegmentLabel(this.currentGroup.renderedSegment, labelText);
        this.placedLabelKeys.push(key);
        this.labelTextIndex++;
        return label;
      }
      return null;
    }
  }, {
    key: 'constructSegmentLabel',
    value: function constructSegmentLabel(segment, labelText) {
      var label = new _segmentlabel2.default(segment, labelText);
      var styler = this.transitive.styler;
      label.fontFamily = styler.compute2('segment_labels', 'font-family', segment);
      label.fontSize = styler.compute2('segment_labels', 'font-size', segment);

      var textDimensions = (0, _measureText2.default)({
        text: labelText,
        fontSize: label.fontSize + 'px',
        fontFamily: label.fontFamily || 'sans-serif',
        lineHeight: 1.2
      });

      label.textWidth = textDimensions.width.value;
      label.textHeight = textDimensions.height.value;
      label.computeContainerDimensions();

      return label;
    }
  }, {
    key: 'findOverlaps',
    value: function findOverlaps(label, labelBBox) {
      var minX = labelBBox.x - this.maxBBoxWidth / 2;
      var minY = labelBBox.y - this.maxBBoxHeight / 2;
      var maxX = labelBBox.x + labelBBox.width + this.maxBBoxWidth / 2;
      var maxY = labelBBox.y + labelBBox.height + this.maxBBoxHeight / 2;
      // debug('findOverlaps %s,%s %s,%s', minX,minY,maxX,maxY);

      var matchItems = [];
      this.quadtree.visit(function (node, x1, y1, x2, y2) {
        var p = node.point;
        if (p && p[0] >= minX && p[0] < maxX && p[1] >= minY && p[1] < maxY && label.intersects(p[2])) {
          matchItems.push(p[2]);
        }
        return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY;
      });
      return matchItems;
    }
  }, {
    key: 'findNearbySegmentLabels',
    value: function findNearbySegmentLabels(label, x, y, buffer) {
      var minX = x - buffer;
      var minY = y - buffer;
      var maxX = x + buffer;
      var maxY = y + buffer;
      // debug('findNearby %s,%s %s,%s', minX,minY,maxX,maxY);

      var matchItems = [];
      this.quadtree.visit(function (node, x1, y1, x2, y2) {
        var p = node.point;
        if (p && p[0] >= minX && p[0] < maxX && p[1] >= minY && p[1] < maxY && p[2].parent && label.parent.patternIds === p[2].parent.patternIds) {
          matchItems.push(p[2]);
        }
        return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY;
      });
      return matchItems;
    }
  }]);
  return Labeler;
}(); // TODO: replace w/ other quadtree library

exports.default = Labeler;
module.exports = exports['default'];

//# sourceMappingURL=labeler.js