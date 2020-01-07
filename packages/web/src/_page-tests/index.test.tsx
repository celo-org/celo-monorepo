import HomePage from 'pages/index'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('HomePage', () => {
  it('renders', () => {
    const tree = renderer.create(<HomePage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
