
## 0.8.1 — 2015-11-27

* Don't require .css directly.

## 0.8.0 — 2015-11-11

* Removed component as build system; all dependencies now defined in package.json
* Broke out 'test' example to new transitive-demo repo

## 0.7.2 — 2015-11-11

* Upgraded component to 1.0
* Fixed failing lint test
* Updated 'test' example
* Final release before removing component-specific dependencies

## 0.7.1 — 2015-02-23

* Updated `setDisplayBounds` / `getNetworkBounds` API methods
* Fix legend
* Make [[west,south], [east,north]] standard for bounds
* Allow direct rendering of patterns (w/o associated journeys)
* Fix segment labeling

## 0.7.0 — 2015-01-30

* Leaflet.js compatibility changes!
* Check that network has been rendered before refreshing
* Emit events for clear/load data actions
* Allow resizing to be handled by external control (e.g. leaflet)
* Updated zoom/scale logic to accommodate external map controls (e.g. leaflet)
* Allow enabling/disabling of native pan/zoom support
* Add setBounds() API call
* Empty existing element contents in setElement() via remove(), not innerHTML=null

## 0.6.6 — 2015-01-23

* Reset display scale on data update

## 0.6.5 — 2015-01-23

* Fixed broken reference in dragging code
* Don't auto-render on data update
* Fix broken graph reference in Display constructor
* Create empty Display if needed in getModeStyles()
* Set default bounds when needed
* Additional refactoring

## 0.6.4 — 2015-01-09

* Bug fix

## 0.6.3 — 2015-01-09

* Emit click events from the display with cartesian and geographic coordinates

## 0.6.2 — 2014-10-20

* Remove `lib/transitive.js` from `.gitignore`

## 0.6.1 — 2014-10-31

* Return the mode styles

## 0.6.0 — 2014-10-31

* Always put places in front of stops
* Refactor legend to use CSS based styling
* Check if tile layer is active before calling refresh
* Accept missing/empty data
* Add `initialBounds` option
* Add `clearData` & `updateData` methods
* Bug fixes

## 0.5.0 — 2014-10-09

* Increase map panning performance
* Auto-resize when window changes
* Clean up legend formatting
* Show route/stop names as is
* Add draggable places

## 0.4.0 — 2014-09-10

* Rendering updates
* Resize

## 0.3.1 — 2014-08-04

* Update dependencies
* Lots of rendering updates

## 0.3.0 — 2014-06-11

* Add `.jsbeautify` config file
* Removed data filters, should be done outside the lib
* Removed unused libs
* Improved dynamic rendering
* Added ability to pull in Mapbox tiles

## 0.2.1 — 2014-05-19

* Bug fixes and error handling
* Generate legend

## 0.2.0 — 2014-05-02

* Update to work with OTP 1.0.x

## 0.1.0 — 2014-04-23

* Started tracking History
* Modified main function signature
* Moved profiler to be a development dependency
