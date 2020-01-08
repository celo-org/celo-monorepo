import About from 'pages/about'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('About', () => {
  it('renders', () => {
    const tree = renderer.create(<About randomSeed={100} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
