/* globals describe, it */

const Transitive = require('../lib/transitive')

describe('transitive', () => {
  describe('issues', () => {
    it('transitive crashes with specific data (#39)', () => {
      const sampleData = require('./issue-39-data.json')

      const testDiv = document.createElement('div')
      const transitive = new Transitive({ el: testDiv })

      transitive.updateData(sampleData)
      transitive.render()
    })
  })
})
