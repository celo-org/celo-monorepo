import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Rise from '../../../pages/animation/rise'

describe('Animations/Rise', () => {
  it('renders', () => {
    const tree = renderer.create(<Rise />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
