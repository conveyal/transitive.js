/** TODO: use library? **/

export function decode(polyline) {
  let currentPosition = 0

  let currentLat = 0
  let currentLng = 0

  const dataLength = polyline.length

  const polylineLatLngs = []

  while (currentPosition < dataLength) {
    let shift = 0
    let result = 0

    var byte

    do {
      byte = polyline.charCodeAt(currentPosition++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    currentLat += deltaLat

    shift = 0
    result = 0

    do {
      byte = polyline.charCodeAt(currentPosition++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltLng = result & 1 ? ~(result >> 1) : result >> 1

    currentLng += deltLng

    polylineLatLngs.push([currentLat * 0.00001, currentLng * 0.00001])
  }
  return polylineLatLngs
}
