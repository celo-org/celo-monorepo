import * as React from 'react'
import * as renderer from 'react-test-renderer'
import HomePage from 'pages/index'

describe('HomePage', () => {
  it('renders', () => {
    const tree = renderer.create(<HomePage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
