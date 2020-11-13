export function getPlaceName (place, companies) {
  // If address is provided (i.e. for carshare station, use it)
  if (place.address) return place.address.split(',')[0]
  if (place.networks && place.vertexType === 'VEHICLERENTAL') {
    // For vehicle rental pick up, do not use the place name. Rather, use
    // company name + vehicle type (e.g., SPIN E-scooter). Place name is often just
    // a UUID that has no relevance to the actual vehicle. For bikeshare, however,
    // there are often hubs or bikes that have relevant names to the user.
    const company = null
    if (company) {
      return `${company.label}`
    }
  }
  // Default to place name
  return place.name
}

// All OTP transit modes
export const transitModes = [
  'TRAM',
  'BUS',
  'SUBWAY',
  'FERRY',
  'RAIL',
  'GONDOLA'
]

/**
 * @param  {config} config OTP-RR configuration object
 * @return {Array}  List of all transit modes defined in config; otherwise default mode list
 */

export function getTransitModes (config) {
  if (!config || !config.modes || !config.modes.transitModes) {
    return transitModes
  }
  return config.modes.transitModes.map(tm => tm.mode)
}

export function isTransit (mode) {
  return transitModes.includes(mode) || mode === 'TRANSIT'
}

export function itineraryToTransitive (itin, companies) {
  const tdata = {
    journeys: [],
    streetEdges: [],
    places: [],
    patterns: [],
    routes: [],
    stops: []
  }
  const routes = {}
  const stops = {}
  let streetEdgeId = 0
  let patternId = 0

  const journey = {
    journey_id: 'itin',
    journey_name: 'Iterarary-derived Journey',
    segments: []
  }

  // add 'from' and 'to' places to the tdata places array
  tdata.places.push({
    place_id: 'from',
    place_lat: itin.legs[0].from.lat,
    place_lon: itin.legs[0].from.lon
  })
  tdata.places.push({
    place_id: 'to',
    place_lat: itin.legs[itin.legs.length - 1].to.lat,
    place_lon: itin.legs[itin.legs.length - 1].to.lon
  })

  itin.legs.forEach((leg, idx) => {
    if (
      leg.mode === 'WALK' ||
      leg.mode === 'BICYCLE' ||
      leg.mode === 'CAR' ||
      leg.mode === 'MICROMOBILITY'
    ) {
      let fromPlaceId
      if (leg.from.bikeShareId) {
        fromPlaceId = `bicycle_rent_station_${leg.from.bikeShareId}`
      } else if (leg.from.vertexType === 'VEHICLERENTAL') {
        fromPlaceId = `escooter_rent_station_${leg.from.name}`
      } else if (
        leg.mode === 'CAR' &&
        idx > 0 &&
        itin.legs[idx - 1].mode === 'WALK'
      ) {
        // create a special place ID for car legs preceeded by walking legs
        fromPlaceId = `itin_car_${streetEdgeId}_from`
      } else {
        fromPlaceId = `itin_street_${streetEdgeId}_from`
      }

      let toPlaceId
      if (leg.to.bikeShareId) {
        toPlaceId = `bicycle_rent_station_${leg.to.bikeShareId}`
      } else if (leg.to.vertexType === 'VEHICLERENTAL') {
        toPlaceId = `escooter_rent_station_${leg.to.name}`
      } else if (
        leg.mode === 'CAR' &&
        idx < itin.legs.length - 1 &&
        itin.legs[idx + 1].mode === 'WALK'
      ) {
        // create a special place ID for car legs followed by walking legs
        toPlaceId = `itin_car_${streetEdgeId}_to`
      } else {
        toPlaceId = `itin_street_${streetEdgeId}_to`
      }

      const segment = {
        type: leg.mode,
        streetEdges: [streetEdgeId],
        from: { type: 'PLACE', place_id: fromPlaceId },
        to: { type: 'PLACE', place_id: toPlaceId }
      }
      // For TNC segments, draw using an arc
      if (leg.mode === 'CAR' && leg.hailedCar) segment.arc = true
      journey.segments.push(segment)

      tdata.streetEdges.push({
        edge_id: streetEdgeId,
        geometry: leg.legGeometry
      })
      tdata.places.push({
        place_id: fromPlaceId,
        // Do not label the from place in addition to the to place. Otherwise,
        // in some cases (bike rental station) the label for a single place will
        // appear twice on the rendered transitive view.
        // See https://github.com/conveyal/trimet-mod-otp/issues/152
        // place_name: leg.from.name,
        place_lat: leg.from.lat,
        place_lon: leg.from.lon
      })
      tdata.places.push({
        place_id: toPlaceId,
        place_name: getPlaceName(leg.to, companies),
        place_lat: leg.to.lat,
        place_lon: leg.to.lon
      })
      streetEdgeId++
    }
    if (isTransit(leg.mode)) {
      // determine if we have valid inter-stop geometry
      const hasInterStopGeometry = !!leg.interStopGeometry
      const hasIntermediateStopGeometry =
        hasInterStopGeometry &&
        leg.intermediateStops &&
        leg.interStopGeometry.length === leg.intermediateStops.length + 1

      // create leg-specific pattern
      const ptnId = `ptn_${patternId}`
      const pattern = {
        pattern_id: ptnId,
        pattern_name: `Pattern ${patternId}`,
        route_id: leg.routeId,
        stops: []
      }

      // add 'from' stop to stops dictionary and pattern object
      stops[leg.from.stopId] = {
        stop_id: leg.from.stopId,
        stop_name: leg.from.name,
        stop_lat: leg.from.lat,
        stop_lon: leg.from.lon
      }
      pattern.stops.push({ stop_id: leg.from.stopId })

      // add intermediate stops to stops dictionary and pattern object
      if (leg.intermediateStops) {
        leg.intermediateStops.forEach((stop, i) => {
          stops[stop.stopId] = {
            stop_id: stop.stopId,
            stop_name: stop.name,
            stop_lat: stop.lat,
            stop_lon: stop.lon
          }
          pattern.stops.push({
            stop_id: stop.stopId,
            geometry:
              hasIntermediateStopGeometry && leg.interStopGeometry[i].points
          })
        })
      }

      // add 'to' stop to stops dictionary and pattern object
      stops[leg.to.stopId] = {
        stop_id: leg.to.stopId,
        stop_name: leg.to.name,
        stop_lat: leg.to.lat,
        stop_lon: leg.to.lon
      }
      pattern.stops.push({
        stop_id: leg.to.stopId,
        geometry:
          hasInterStopGeometry &&
          (hasIntermediateStopGeometry
            ? leg.interStopGeometry[leg.interStopGeometry.length - 1].points
            : leg.legGeometry.points)
      })

      // add route to the route dictionary
      routes[leg.routeId] = {
        agency_id: leg.agencyId,
        route_id: leg.routeId,
        route_short_name: leg.routeShortName || '',
        route_long_name: leg.routeLongName || '',
        route_type: leg.routeType,
        route_color: leg.routeColor
      }

      // add the pattern to the tdata patterns array
      tdata.patterns.push(pattern)

      // add the pattern refrerence to the journey object
      journey.segments.push({
        type: 'TRANSIT',
        patterns: [
          {
            pattern_id: ptnId,
            from_stop_index: 0,
            to_stop_index: leg.intermediateStops
              ? leg.intermediateStops.length + 2 - 1
              : 1
          }
        ]
      })

      patternId++
    }
  })

  // add the routes and stops to the tdata arrays
  tdata.routes.push(...Object.values(routes))
  tdata.stops.push(...Object.values(stops))

  // add the journey to the tdata journeys array
  tdata.journeys.push(journey)

  // console.log('derived tdata', tdata)
  return tdata
}
