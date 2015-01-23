
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
