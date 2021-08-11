export default class LinearScale {
  constructor(domain, range) {
    this.domain = domain
    this.range = range
  }

  compute(val) {
    const { domain: d, range: r } = this
    return ((val - d[0]) / (d[1] - d[0])) * (r[1] - r[0]) + r[0]
  }

  invert(val) {
    const { domain: d, range: r } = this
    return ((val - r[0]) / (r[1] - r[0])) * (d[1] - d[0]) + d[0]
  }
}
