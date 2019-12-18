import * as React from 'react'
import * as renderer from 'react-test-renderer'
import About from './about-us'

describe('About', () => {
  xit('renders', () => {
    const tree = renderer.create(<About randomSeed={100} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
