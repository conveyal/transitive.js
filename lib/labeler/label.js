
/**
 * Dependencies
 */

var augment = require('augment');


/**
 * Label object
 */

var Label = augment(Object, function () {

  this.constructor = function(parent) {

    this.parent = parent;

    this.labelAngle = 0;
    this.labelPosition = 1;
  };


  this.getText = function() {
    if(!this.labelText) {
      this.labelText = this.transformText(this.parent.getName());
    }

    return this.labelText;
  };

  this.render = function() {
    this.svgGroup = this.parent.labelSvg.append('g');

    var typeStr = this.parent.getType().toLowerCase();

    this.mainLabel = this.svgGroup.append('text')
      .datum({ point: this.parent })
      .attr('id', 'transitive-' + typeStr + '-label-' + this.parent.getId())
      .text(this.getText())
      .attr('class', 'transitive-' + typeStr + '-label');
  };


  this.refresh = function() {

    if(!this.labelAnchor) return;

    if(!this.svgGroup) this.render();

    this.svgGroup
      .attr('text-anchor', this.labelPosition > 0 ? 'start' : 'end')
      //.attr('visibility', this.visibility ? 'visible' : 'hidden')
      .attr('transform', (function (d, i) {
        return 'translate(' + this.labelAnchor.x +',' + this.labelAnchor.y +')';
      }).bind(this));

    this.mainLabel
      .attr('transform', (function (d, i) {
        return 'rotate(' + this.labelAngle + ', 0, 0)';
      }).bind(this));
  };


  this.setOrientation = function(orientation) {
    //console.log('lab anch: '+ this.parent.getName());
    this.orientation = orientation;

    var markerBBox = this.parent.getMarkerBBox();
    if(!markerBBox) return;

    var x, y;
    var offset = 5;

    if(orientation === 'E') {
      x = markerBBox.x + markerBBox.width + offset;
      y = markerBBox.y + markerBBox.height / 2;
      this.labelPosition = 1;
      this.labelAngle = 0;
    }

    else if(orientation === 'W') {
      x = markerBBox.x - offset;
      y = markerBBox.y + markerBBox.height / 2;
      this.labelPosition = -1;
      this.labelAngle = 0;
    }

    else if(orientation === 'N') {
      x = markerBBox.x + markerBBox.width / 2;
      y = markerBBox.y - offset;
      this.labelPosition = 1;
      this.labelAngle = -90;
    }

    else if(orientation === 'S') {
      x = markerBBox.x + markerBBox.width / 2;
      y = markerBBox.y + markerBBox.height + offset;
      this.labelPosition = -1;
      this.labelAngle = -90;
    }

    this.labelAnchor = { x : x, y : y };
  };

  this.setVisibility = function(visibility) {
    if(this.svgGroup) this.svgGroup.attr('visibility', visibility ? 'visible' : 'hidden');
  };


  this.getBBox = function() {

    if(this.orientation === 'E') {
      return {
        x : this.labelAnchor.x,
        y : this.labelAnchor.y - this.textHeight,
        width : this.textWidth,
        height : this.textHeight
      };
    }

    if(this.orientation === 'W') {
      return {
        x : this.labelAnchor.x - this.textWidth,
        y : this.labelAnchor.y - this.textHeight,
        width : this.textWidth,
        height : this.textHeight
      };
    }

    if(this.orientation === 'N') {
      return {
        x : this.labelAnchor.x - this.textHeight,
        y : this.labelAnchor.y - this.textWidth,
        width : this.textHeight,
        height : this.textWidth
      };
    }

    if(this.orientation === 'S') {
      return {
        x : this.labelAnchor.x - this.textHeight,
        y : this.labelAnchor.y,
        width : this.textHeight,
        height : this.textWidth
      };
    }
  };

  this.intersects = function(obj) {
    if(obj instanceof Label) {
      return this.intersectsBBox(obj.getBBox());
    }
    else if(obj.x && obj.y && obj.width && obj.height) {
      return this.intersectsBBox(obj);
    }

    return false;
  };

  this.intersectsBBox = function(bbox) {
    if(this.orientation === 'E' || this.orientation === 'W' || this.orientation === 'N' || this.orientation === 'S') {
      var thisBBox = this.getBBox(this.orientation);
      var r = (thisBBox.x <= bbox.x + bbox.width &&
              bbox.x <= thisBBox.x + thisBBox.width &&
              thisBBox.y <= bbox.y + bbox.height &&
              bbox.y <= thisBBox.y + thisBBox.height);
      return r;
    }
  };

  this.transformText = function(str) {
    // basic 'title case' for now
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

});


/**
 * Expose `Label`
 */

module.exports = Label;