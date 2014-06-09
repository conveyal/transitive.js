var d3 = require('d3');
var debug = require('debug')('transitive:tile-layer');

var geoTile = require('./d3.geo.tile');

var prefix = prefixMatch(['webkit', 'ms', 'Moz', 'O']);
var tileZoomScaleExtents = [1 << 18, 1 << 24];

/**
 * Tile layer takes a parent element, a zoom behavior, and a Mapbox ID
 *
 * @param {Object} opts
 */

module.exports = function TileLayer(opts) {
  debug('creating the tile layer');

  var el = opts.el;
  var graph = opts.graph;
  var height = el.clientHeight;
  var id = opts.mapboxId;
  var width = el.clientWidth;
  var zoom = opts.zoom;

  // Center lat / lon point
  var bounds = graph.bounds();
  var center = [
    (bounds.lon.max + bounds.lon.min) / 2, (bounds.lat.max + bounds.lat.min) /
    2
  ];

  // Set up the projection
  var projection = d3.geo.mercator()
    .scale((1 << 21) / 2 / Math.PI)
    .translate([-width / 2, -height / 2]);

  debug('project center %j -> %j', center, projection(center));

  // Set up the new zoom
  var tileZoom = d3.behavior.zoom()
    .scale(projection.scale() * 2 * Math.PI)
    .scaleExtent(tileZoomScaleExtents)
    .translate(projection(center).map(function(x) {
      return -x;
    }))
    .on('zoom', zoomed);

  var lastScale = tileZoom.scale();
  var lastTranslate = tileZoom.translate();

  // Original Tile Translation
  var baseTranslate = tileZoom.translate();

  // Set up the map tiles
  var tile = geoTile()
    .size([width, height]);

  // Create the tile layer
  var tileLayer = d3.select(el)
    // .call(tileZoom)
    .on('mousemove', mousemoved)
    .append('div')
    .attr('class', 'tile-layer');

  var info = d3.select(el)
    .append('div')
    .style('position', 'absolute')
    .style('right', '10px')
    .style('bottom', '10px')
    .style('z-index', 200);

  debug('original zoom extent %j', zoom.scaleExtent());

  var scaleZoom = d3.scale.linear()
    .domain([0.25, 1, 4])
    .range([1 << 21 / 2, 1 << 21, 1 << 21 * 2]);

  // Zoom
  zoom.on('zoom.tile-layer', zoomed);

  // Initial zoom
  zoomed();

  // Reload tiles on pan and zoom
  function zoomed() {
    debug('bounds', graph.bounds());

    tileZoom.scale(scaleZoom(zoom.scale()));

    debug('tileZoom.scale %s', lastScale - tileZoom.scale());
    debug('tileZoom.translate %j', [lastTranslate[0] - tileZoom.translate()[0], lastTranslate[1] - tileZoom.translate()[1]]);
    debug('zoom.scale %s', zoom.scale());
    debug('zoom.translate %j', zoom.translate());

    if (d3.event) {
      debug('event.scale %s', d3.event.scale);
      debug('event.translate %j', d3.event.translate);
    }

    lastScale = tileZoom.scale();
    lastTranslate = tileZoom.translate();

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
      });
  }

  function mousemoved() {
    info.text(formatLocation(projection.invert(d3.mouse(this)), tileZoom.scale()) + ' @ ' + Math.round(tileZoom.scale()));
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
