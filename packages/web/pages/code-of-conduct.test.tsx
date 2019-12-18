import * as React from 'react'
import * as renderer from 'react-test-renderer'
import CodeOfConduct from './code-of-conduct'

describe('CodeOfConduct', () => {
  it('renders', () => {
    const tree = renderer.create(<CodeOfConduct />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
