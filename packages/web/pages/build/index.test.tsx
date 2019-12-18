import * as React from 'react'
import * as renderer from 'react-test-renderer'
import BuildPage from './index'

describe('BuildPage', () => {
  it('renders', () => {
    const tree = renderer.create(<BuildPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
