import Terms from 'pages/terms'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('Terms', () => {
  it('renders', () => {
    const tree = renderer.create(<Terms />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
