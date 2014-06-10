var d3 = require('d3');
var debug = require('debug')('transitive:tile-layer');

var geoTile = require('./d3.geo.tile');
var SphericalMercator = require('./spherical-mercator');

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
    .scale(1)
    .translate([0, 0]);

  // Set up the new zoom
  var tileZoom = d3.behavior.zoom();

  // Set up the map tiles
  var tile = geoTile()
    .size([width, height]);

  // Create the tile layer
  var tileLayer = d3.select(el)
    .on('mousemove', mousemoved)
    .append('div')
    .attr('class', 'tile-layer');

  var info = d3.select(el)
    .append('div')
    .style('position', 'absolute')
    .style('right', '10px')
    .style('bottom', '10px')
    .style('z-index', 200);

  // Zoom
  zoom.on('zoom.tile-layer', zoomed);

  // Initial zoom
  zoomed();

  // Reload tiles on pan and zoom
  function zoomed() {
    /* Center lat / lon point
    var bounds = graph.bounds();

    var b = [
      [bounds.x.min, bounds.y.min],
      [bounds.x.min, bounds.y.max]
    ];
    var s = 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
    var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    debug('calc.scale %s', s);
    debug('calc.translate %j', t);
    debug('bounds', bounds);
    debug('zoom.scale %s', zoom.scale());
    debug('zoom.translate %j', zoom.translate());

    if (d3.event) {
      debug('event.scale %s', d3.event.scale);
      debug('event.translate %j', d3.event.translate);
    }

    var tiles = tile
      .scale(tileZoom.scale())
      .translate(tileZoom.translate())();

    projection
      .scale(tileZoom.scale() / 2 / Math.PI)
      .translate(tileZoom.translate());

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
          '.tiles.mapbox.com/v3/' + id + '/' + d[2] + '/' + d[0] + '/' + d[1] +
          '.png';
      })
      .style('left', function(d) {
        return (d[0] << 8) + 'px';
      })
      .style('top', function(d) {
        return (d[1] << 8) + 'px';
      }); */
  }

  function mousemoved() {
    var bounds = display.llBounds();
    info.text('NW: ' + bounds[0][1] + ',' + bounds[0][0] + ' SE: ' + bounds[1][1] + ',' + bounds[1][0]);
  }
};

/**
 * Get the 3D Transform Matrix
 */

function matrix3d(scale, translate) {
  debug('tile scale %s, translation %j', scale, translate);

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

/**
 * Format Location
 */

function formatLocation(p, k) {
  var format = d3.format('.' + Math.floor(Math.log(k) / 2 - 2) + 'f');
  return (p[1] < 0 ? format(-p[1]) + '°S' : format(p[1]) + '°N') + ' '
       + (p[0] < 0 ? format(-p[0]) + '°W' : format(p[0]) + '°E');
}
