import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Community from 'pages/community'

describe('Community', () => {
  it('renders', () => {
    const tree = renderer.create(<Community />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
