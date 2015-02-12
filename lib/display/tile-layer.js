var d3 = require('d3');
var debug = require('debug')('transitive:tile-layer');

var geoTile = require('./d3.geo.tile');
var SphericalMercator = require('../util/spherical-mercator');

var prefix = prefixMatch(['webkit', 'ms', 'Moz', 'O']);

/**
 * Tile layer takes a parent element, a zoom behavior, and a Mapbox ID
 *
 * @param {Object} opts
 */

module.exports = function TileLayer(opts) {
  debug('creating the tile layer');

  var el = opts.el;
  var display = opts.display;
  var graph = opts.graph;
  var height = el.clientHeight;
  var id = opts.mapboxId;
  var width = el.clientWidth;
  var zoom = display.zoom;

  // Set up the projection
  var projection = d3.geo.mercator()
    .translate([width / 2, height / 2]);

  // Set up the map tiles
  var tile = geoTile();

  // Create the tile layer
  var tileLayer = d3.select(el)
    .append('div')
    .attr('class', 'tile-layer');

  // Initial zoom
  zoomed();

  this.zoomed = zoomed;

  // Reload tiles on pan and zoom
  function zoomed() {
    // Get the height and width
    height = el.clientHeight;
    width = el.clientWidth;

    // Set the map tile size
    tile.size([width, height]);

    // Get the current display bounds
    var bounds = display.llBounds();

    // Project the bounds based on the current projection
    var psw = projection(bounds[0]);
    var pne = projection(bounds[1]);

    // Based the new scale and translation vector off the current one
    var scale = projection.scale() * 2 * Math.PI;
    var translate = projection.translate();

    var dx = pne[0] - psw[0];
    var dy = pne[1] - psw[1];

    scale = scale * (1 / Math.max(dx / width, dy / height));
    projection
      .translate([width / 2, height / 2])
      .scale(scale / 2 / Math.PI);

    // Reproject the bounds based on the new scale and translation vector
    psw = projection(bounds[0]);
    pne = projection(bounds[1]);
    var x = (psw[0] + pne[0]) / 2;
    var y = (psw[1] + pne[1]) / 2;
    translate = [width - x, height - y];

    // Update the Geo tiles
    tile
      .scale(scale)
      .translate(translate);

    // Get the new set of tiles and render
    renderTiles(tile());
  }

  // Render tiles
  function renderTiles(tiles) {
    var image = tileLayer
      .style(prefix + 'transform', matrix3d(tiles.scale, tiles.translate))
      .selectAll('.tile')
      .data(tiles, function(d) {
        return d;
      });

    image.exit()
      .remove();

    image.enter().append('img')
      .attr('class', 'tile')
      .attr('src', function(d) {
        return 'http://' + ['a', 'b', 'c', 'd'][Math.random() * 4 | 0] +
          '.tiles.mapbox.com/v3/' + id + '/' + d[2] + '/' + d[0] +
          '/' + d[1] + '.png';
      })
      .style('left', function(d) {
        return (d[0] << 8) + 'px';
      })
      .style('top', function(d) {
        return (d[1] << 8) + 'px';
      });
  }
};

/**
 * Get the 3D Transform Matrix
 */

function matrix3d(scale, translate) {
  var k = scale / 256,
    r = scale % 1 ? Number : Math.round;
  return 'matrix3d(' + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] *
    scale), r(translate[1] * scale), 0, 1] + ')';
}

/**
 * Match the transform prefix
 */

function prefixMatch(p) {
  var i = -1,
    n = p.length,
    s = document.body.style;
  while (++i < n)
    if (p[i] + 'Transform' in s) return '-' + p[i].toLowerCase() + '-';
  return '';
}
