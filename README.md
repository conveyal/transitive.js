# transitive.js [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url]

A tool for generating dynamic stylized transit maps that are easy to understand. Transitive takes in information describing specific transport network elements (routes, stops, journeys) -- typically produced by the OpenTripPlanner Profiler extension -- and produces a schematic map of those elements:

![threeoptions](http://conveyal.com/img/transitive/threeoptions.png)

Dynamic styling of the network elements allows for interactivity and flexibility in the visual presentation. For instance, a single journey can be highlighted:

![threeoptions_focused](http://conveyal.com/img/transitive/threeoptions_focused.png)

A Transitive map can be embedded as a freestanding web element or overlaid onto a [Leaflet](http://leafletjs.com/) map using the [Leaflet.TransitiveLayer](https://github.com/conveyal/Leaflet.TransitiveLayer) plugin.

Transitive is supported by the [Mobility Lab](http://mobilitylab.org/) [Transit Tech Initiative](http://mobilitylab.org/tech/transit-tech-initiative/). Read more in [this Mobility Lab article](http://mobilitylab.org/2014/04/16/the-technology-behind-a-new-kind-of-travel-planning/).

## Demo

* [Demo of a freestanding Transitive map](http://conveyal.github.io/transitive.js)
* [Demo using Leaflet and Leaflet.TransitiveLayer](http://conveyal.github.io/Leaflet.TransitiveLayer)

## API

[See documentation here](https://github.com/conveyal/transitive.js/wiki/API-Documentation).

## See Also

- [conveyal/modeify](https://github.com/conveyal/modeify)

## License

MIT

[npm-image]: https://img.shields.io/npm/v/transitive-js.svg?maxAge=2592000&style=flat-square
[npm-url]: https://www.npmjs.com/package/transitive-js
[travis-image]: https://img.shields.io/travis/conveyal/transitive.js.svg?style=flat-square
[travis-url]: https://travis-ci.org/conveyal/transitive.js
