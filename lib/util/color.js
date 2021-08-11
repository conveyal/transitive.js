/**
 * For a provided hex color, returns an inverted color for legibility.
 * @param  {[type]} hex - hexadecimal (HTML) color, e.g. #FFFFFF
 * @param  {[type]} bw  - whether to return only black or white as inverted color
 * @return {[type]}     [description]
 */
export function invertColor(hex, bw = true) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (hex.length !== 6) {
    console.warn('Invalid HEX color.', hex)
  }
  let r = parseInt(hex.slice(0, 2), 16)
  let g = parseInt(hex.slice(2, 4), 16)
  let b = parseInt(hex.slice(4, 6), 16)
  if (bw) {
    // http://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF'
  }
  // invert color components
  r = (255 - r).toString(16)
  g = (255 - g).toString(16)
  b = (255 - b).toString(16)
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b)
}

export function padZero(str, len) {
  len = len || 2
  const zeros = new Array(len).join('0')
  return (zeros + str).slice(-len)
}
