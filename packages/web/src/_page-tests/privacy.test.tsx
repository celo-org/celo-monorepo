import Privacy from 'pages/privacy'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('Privacy', () => {
  it('renders', () => {
    const tree = renderer.create(<Privacy />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
