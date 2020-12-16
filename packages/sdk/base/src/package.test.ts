import { assert } from 'chai'
import { readFileSync } from 'fs'

const pdef = JSON.parse(readFileSync('./package.json', 'utf-8'))

describe('Base package', () => {
  // @celo/base is built on the premise of having absolutely no dependencies, no exceptions made
  it('Should have an explicitly defined empty dependencies property', () => {
    assert.isObject(pdef)
    assert.property(pdef, 'dependencies')
    assert.isEmpty(pdef.dependencies)
  })
})
