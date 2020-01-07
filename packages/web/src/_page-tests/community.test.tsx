import Community from 'pages/community'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('Community', () => {
  it('renders', () => {
    const tree = renderer.create(<Community />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
