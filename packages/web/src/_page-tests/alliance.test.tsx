import Alliance from 'pages/alliance'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('Alliance', () => {
  it('renders', () => {
    const tree = renderer.create(<Alliance />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
