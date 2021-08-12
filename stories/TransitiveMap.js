import BaseMap from '@opentripplanner/base-map'
import coreUtils from '@opentripplanner/core-utils'
import propTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import TransitiveOverlay from './transitive-overlay'

import '../node_modules/leaflet/dist/leaflet.css'

require('./leaflet-canvas-layer')

const MapContainer = styled.div`
  height: 800px;
  width: 100%;

  .map {
    height: 800px;
    width: 100%;
  }

  * {
    box-sizing: unset;
  }
`

/**
 * Primary UI component for user interaction
 */
export const TransitiveMap = ({
  center = [45.506, -122.68302],
  companies = [],
  itinerary,
  labeledModes,
  styles,
  // If no transitiveData is provided, default to generating from itinerary.
  transitiveData = coreUtils.map.itineraryToTransitive(itinerary, companies),
  zoom = 15,
  zoomFactors
}) => {
  return (
    <MapContainer>
      <BaseMap
        // TODO: Determine center/zoom based on input data?
        center={center}
        zoom={zoom}
      >
        <TransitiveOverlay
          labeledModes={labeledModes}
          styles={styles}
          transitiveData={transitiveData}
          visible
          zoomFactors={zoomFactors}
        />
      </BaseMap>
    </MapContainer>
  )
}

TransitiveMap.propTypes = {
  center: propTypes.arrayOf(propTypes.number),
  companies: propTypes.arrayOf(propTypes.string),
  itinerary: coreUtils.types.itinerary,
  labeledModes: propTypes.arrayOf(propTypes.string),
  styles: propTypes.object,
  transitiveData: propTypes.object,
  zoom: propTypes.number,
  zoomFactors: propTypes.arrayOf(propTypes.object)
}
