import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Terms from '../../../pages/stake-off/terms'

describe('Terms', () => {
  it('renders', () => {
    const tree = renderer.create(<Terms />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
