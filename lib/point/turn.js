import { sm } from '../util'

import Point from './point'

/**
 * A Point subclass representing a turn point in turn-by-turn directions for a
 * walk/bike/drive segment
 */

export default class TurnPoint extends Point {
  constructor(data, id) {
    super(data)
    this.name = `Turn @ ${data.lat}, ${data.lon}`
    if (!this.worldX || !this.worldY) {
      const smCoords = sm.forward([data.lon, data.lat])
      this.worldX = smCoords[0]
      this.worldY = smCoords[1]
      this.isSegmentEndPoint = false
    }
    this.id = id
  }

  getId() {
    return this.id
  }

  getType() {
    return 'TURN'
  }

  getName() {
    return this.name
  }

  containsSegmentEndPoint() {
    return this.isSegmentEndPoint
  }
}
