import { forEach } from 'lodash'
import measureText from 'measure-text'
import d3 from 'd3' // TODO: replace w/ other quadtree library

import { getFontSizeWithUnit } from '../util'

import SegmentLabel from './segmentlabel'

/**
 * Labeler object
 */

export default class Labeler {
  constructor(transitive) {
    this.transitive = transitive
    this.clear()
  }

  clear() {
    this.points = []
  }

  updateLabelList(graph) {
    this.points = []
    forEach(graph.vertices, (vertex) => {
      const point = vertex.point
      if (
        point.getType() === 'PLACE' ||
        point.getType() === 'MULTI' ||
        (point.getType() === 'STOP' && point.isSegmentEndPoint)
      ) {
        this.points.push(point)
      }
    })

    this.points.sort((a, b) => {
      if (a.containsFromPoint() || a.containsToPoint()) return -1
      if (b.containsFromPoint() || b.containsToPoint()) return 1
      return 0
    })
  }

  updateQuadtree() {
    this.quadtree = d3.geom.quadtree().extent([
      [-this.width, -this.height],
      [this.width * 2, this.height * 2]
    ])([])

    this.addPointsToQuadtree()
    // this.addSegmentsToQuadtree();
  }

  addPointsToQuadtree() {
    forEach(this.points, (point) => {
      const mbbox = point.getMarkerBBox()
      if (mbbox) this.addBBoxToQuadtree(point.getMarkerBBox())
    })
  }

  addSegmentsToQuadtree() {
    forEach(this.transitive.renderSegments, (segment) => {
      if (segment.getType() !== 'TRANSIT') return

      let lw = this.transitive.style.compute(
        this.transitive.style.segments['stroke-width'],
        this.transitive.display,
        segment
      )
      lw = parseFloat(lw.substring(0, lw.length - 2), 10) - 2

      let x, x1, x2, y, y1, y2
      // debug(segment.toString());
      if (segment.renderData.length === 2) {
        // basic straight segment
        if (segment.renderData[0].x === segment.renderData[1].x) {
          // vertical
          x = segment.renderData[0].x - lw / 2
          y1 = segment.renderData[0].y
          y2 = segment.renderData[1].y
          this.addBBoxToQuadtree({
            height: Math.abs(y1 - y2),
            width: lw,
            x: x,
            y: Math.min(y1, y2)
          })
        } else if (segment.renderData[0].y === segment.renderData[1].y) {
          // horizontal
          x1 = segment.renderData[0].x
          x2 = segment.renderData[1].x
          y = segment.renderData[0].y - lw / 2
          this.addBBoxToQuadtree({
            height: lw,
            width: Math.abs(x1 - x2),
            x: Math.min(x1, x2),
            y: y
          })
        }
      }

      if (segment.renderData.length === 4) {
        // basic curved segment
        if (segment.renderData[0].x === segment.renderData[1].x) {
          // vertical first
          x = segment.renderData[0].x - lw / 2
          y1 = segment.renderData[0].y
          y2 = segment.renderData[3].y
          this.addBBoxToQuadtree({
            height: Math.abs(y1 - y2),
            width: lw,
            x: x,
            y: Math.min(y1, y2)
          })

          x1 = segment.renderData[0].x
          x2 = segment.renderData[3].x
          y = segment.renderData[3].y - lw / 2
          this.addBBoxToQuadtree({
            height: lw,
            width: Math.abs(x1 - x2),
            x: Math.min(x1, x2),
            y: y
          })
        } else if (segment.renderData[0].y === segment.renderData[1].y) {
          // horiz first
          x1 = segment.renderData[0].x
          x2 = segment.renderData[3].x
          y = segment.renderData[0].y - lw / 2
          this.addBBoxToQuadtree({
            height: lw,
            width: Math.abs(x1 - x2),
            x: Math.min(x1, x2),
            y: y
          })

          x = segment.renderData[3].x - lw / 2
          y1 = segment.renderData[0].y
          y2 = segment.renderData[3].y
          this.addBBoxToQuadtree({
            height: Math.abs(y1 - y2),
            width: lw,
            x: x,
            y: Math.min(y1, y2)
          })
        }
      }
    })
  }

  addBBoxToQuadtree(bbox) {
    if (
      bbox.x + bbox.width / 2 < 0 ||
      bbox.x - bbox.width / 2 > this.width ||
      bbox.y + bbox.height / 2 < 0 ||
      bbox.y - bbox.height / 2 > this.height
    ) {
      return
    }

    this.quadtree.add([bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, bbox])

    this.maxBBoxWidth = Math.max(this.maxBBoxWidth, bbox.width)
    this.maxBBoxHeight = Math.max(this.maxBBoxHeight, bbox.height)
  }

  doLayout() {
    this.width = this.transitive.display.width
    this.height = this.transitive.display.height

    this.maxBBoxWidth = 0
    this.maxBBoxHeight = 0

    this.updateQuadtree()

    return {
      pointLabels: this.placePointLabels(),
      segmentLabels: this.placeSegmentLabels()
    }
  }

  /** placePointLabels **/

  placePointLabels() {
    const styler = this.transitive.styler

    const placedLabels = []
    // var labeledPoints = []

    forEach(this.points, (point) => {
      const labelText = point.label.getText()
      if (!labelText) return
      point.label.fontFamily = styler.compute2('labels', 'font-family', point)
      point.label.fontSize = styler.compute2('labels', 'font-size', point)
      const textDimensions = measureText({
        fontFamily: point.label.fontFamily || 'sans-serif',
        fontSize: point.label.fontSize,
        lineHeight: 1.2,
        text: labelText
      })
      point.label.textWidth = textDimensions.width.value
      point.label.textHeight = textDimensions.height.value

      const orientations = styler.compute(
        styler.labels.orientations,
        this.transitive.display,
        {
          point: point
        }
      )

      let placedLabel = false
      for (let i = 0; i < orientations.length; i++) {
        point.label.setOrientation(orientations[i])
        if (!point.focused) continue

        if (!point.label.labelAnchor) continue

        const lx = point.label.labelAnchor.x
        const ly = point.label.labelAnchor.y

        // do not place label if out of range
        if (lx <= 0 || ly <= 0 || lx >= this.width || ly > this.height) continue

        const labelBBox = point.label.getBBox()

        const overlaps = this.findOverlaps(point.label, labelBBox)

        // do not place label if it overlaps with others
        if (overlaps.length > 0) continue

        // if we reach this point, the label is good to place

        point.label.setVisibility(true)
        // labeledPoints.push(point)
        placedLabels.push(point.label)

        this.quadtree.add([
          labelBBox.x + labelBBox.width / 2,
          labelBBox.y + labelBBox.height / 2,
          point.label
        ])

        this.maxBBoxWidth = Math.max(this.maxBBoxWidth, labelBBox.width)
        this.maxBBoxHeight = Math.max(this.maxBBoxHeight, labelBBox.height)

        placedLabel = true
        break // do not consider any other orientations after places
      } // end of orientation loop

      // if label not placed at all, hide the element
      if (!placedLabel) {
        point.label.setVisibility(false)
      }
    })

    return placedLabels
  }

  /** placeSegmentLabels **/

  placeSegmentLabels() {
    this.placedLabelKeys = []
    const placedLabels = []

    // collect the bus RenderSegments
    const busRSegments = []
    forEach(this.transitive.network.paths, (path) => {
      forEach(path.getRenderedSegments(), (rSegment) => {
        if (rSegment.type === 'TRANSIT' && rSegment.mode === 3) {
          busRSegments.push(rSegment)
        }
      })
    })

    // Generate labels for GTFS route/mode types listed in labeledModes if provided.
    // If labeled modes is not provided, only label the buses (mode '3').
    let edgeGroups = []
    const busModes = [3]
    const labeledModes = this.transitive.options.labeledModes || busModes
    forEach(this.transitive.network.paths, (path) => {
      forEach(path.segments, (segment) => {
        if (
          segment.type === 'TRANSIT' &&
          labeledModes.includes(segment.getMode())
        ) {
          edgeGroups = edgeGroups.concat(segment.getLabelEdgeGroups())
        }
      })
    })

    // iterate through the sequence collection, labeling as necessary
    forEach(edgeGroups, (edgeGroup) => {
      this.currentGroup = edgeGroup
      // get the array of label strings to be places (typically the unique
      // route short names)
      this.labelTextArray = edgeGroup.getLabelTextArray()
      // create the initial label for placement
      this.labelTextIndex = 0

      let label = this.getNextLabel()
      if (!label) return
      // Iterate through potential anchor locations, attempting placement at
      // each one
      const labelAnchors = edgeGroup.getLabelAnchors(
        this.transitive.display,
        label.textHeight * 1.5
      )
      for (let i = 0; i < labelAnchors.length; i++) {
        label.labelAnchor = labelAnchors[i]
        const { x, y } = label.labelAnchor
        // do not consider this anchor if it is out of the display range
        if (!this.transitive.display.isInRange(x, y)) continue
        // check for conflicts with existing placed elements
        const conflicts = this.findOverlaps(label, label.getBBox())

        if (conflicts.length === 0) {
          // If no overlaps/conflicts encountered, place the current label.
          placedLabels.push(label)
          // Track new label in quadtree.
          this.quadtree.add([x, y, label])
          label = this.getNextLabel()
          if (!label) break
        }
      } // end of anchor iteration loop
    }) // end of sequence iteration loop
    return placedLabels
  }

  getNextLabel() {
    while (this.labelTextIndex < this.labelTextArray.length) {
      const labelText = this.labelTextArray[this.labelTextIndex]
      const key = this.currentGroup.edgeIds + '_' + labelText
      if (this.placedLabelKeys.indexOf(key) !== -1) {
        this.labelTextIndex++
        continue
      }
      const label = this.constructSegmentLabel(
        this.currentGroup.renderedSegment,
        labelText
      )
      this.placedLabelKeys.push(key)
      this.labelTextIndex++
      return label
    }
    return null
  }

  constructSegmentLabel(segment, labelText) {
    const label = new SegmentLabel(segment, labelText)
    const styler = this.transitive.styler
    label.fontFamily = styler.compute2('segment_labels', 'font-family', segment)
    label.fontSize = styler.compute2('segment_labels', 'font-size', segment)

    const textDimensions = measureText({
      fontFamily: label.fontFamily || 'sans-serif',

      // Append 'px' if a unit was not specified in font-size.
      fontSize: getFontSizeWithUnit(label.fontSize),
      lineHeight: 1.2,
      text: labelText
    })

    label.textWidth = textDimensions.width.value
    label.textHeight = textDimensions.height.value
    label.computeContainerDimensions()

    return label
  }

  findOverlaps(label, labelBBox) {
    // Get bounding box to check.
    const minX = labelBBox.x - this.maxBBoxWidth / 2
    const minY = labelBBox.y - this.maxBBoxHeight / 2
    const maxX = labelBBox.x + labelBBox.width + this.maxBBoxWidth / 2
    const maxY = labelBBox.y + labelBBox.height + this.maxBBoxHeight / 2
    // debug('findOverlaps %s,%s %s,%s', minX,minY,maxX,maxY);

    const matchItems = []
    // Check quadtree for potential collisions.
    this.quadtree.visit((node, x1, y1, x2, y2) => {
      const { point } = node
      if (point) {
        const [pX, pY, pLabel] = point
        if (
          pX >= minX &&
          pX < maxX &&
          pY >= minY &&
          pY < maxY &&
          label.intersects(pLabel)
        ) {
          matchItems.push(pLabel)
        }
      }
      // No need to visit children of this node if bbox falls entirely within
      // this node.
      return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY
    })
    return matchItems
  }

  findNearbySegmentLabels(label, x, y, buffer) {
    const minX = x - buffer
    const minY = y - buffer
    const maxX = x + buffer
    const maxY = y + buffer
    // debug('findNearby %s,%s %s,%s', minX,minY,maxX,maxY);

    const matchItems = []
    this.quadtree.visit((node, x1, y1, x2, y2) => {
      const p = node.point
      if (
        p &&
        p[0] >= minX &&
        p[0] < maxX &&
        p[1] >= minY &&
        p[1] < maxY &&
        p[2].parent &&
        label.parent.patternIds === p[2].parent.patternIds
      ) {
        matchItems.push(p[2])
      }
      return x1 > maxX || y1 > maxY || x2 < minX || y2 < minY
    })
    return matchItems
  }
}
