# transitive.js [![Build Status](https://travis-ci.org/conveyal/transitive.js.png)](https://travis-ci.org/conveyal/transitive.js) [![Code Climate](https://codeclimate.com/github/conveyal/transitive.js.png)](https://codeclimate.com/github/conveyal/transitive.js)

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

## License

The MIT License (MIT)

Copyright (c) 2013 Conveyal

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/conveyal/transitive.js/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
