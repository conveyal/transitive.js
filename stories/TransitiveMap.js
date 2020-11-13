import styled from 'styled-components'
import React from 'react'
import BaseMap from "@opentripplanner/base-map";

import Transitive from '../lib/transitive'
import TransitiveOverlay from './transitive-overlay'
import {itineraryToTransitive} from './util'

import "../node_modules/leaflet/dist/leaflet.css";

require("./leaflet-canvas-layer")

const zoomFactors = [
  {
    minScale: 0,
    gridCellSize: 0,
    internalVertexFactor: 0,
    angleConstraint: 5,
    mergeVertexThreshold: 0,
    useGeographicRendering: true
  }
];

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
export const TransitiveMap = ({ companies = [], itinerary, styles }) => {
  const data = itineraryToTransitive(itinerary, companies)
  return (
    <MapContainer>
      <BaseMap center={[45.506, -122.68302]} zoom={15}>
        <TransitiveOverlay
          transitiveData={data}
          visible
        />
      </BaseMap>
    </MapContainer>
  )
}
