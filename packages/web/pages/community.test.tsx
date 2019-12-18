import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Community from './community'

describe('Community', () => {
  it('renders', () => {
    const tree = renderer.create(<Community />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
