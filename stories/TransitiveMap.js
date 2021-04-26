import BaseMap from '@opentripplanner/base-map'
import {itineraryToTransitive} from '@opentripplanner/core-utils/lib/map'
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
  transitiveData = itineraryToTransitive(itinerary, companies),
  zoom = 15
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
        />
      </BaseMap>
    </MapContainer>
  )
}
