import * as React from 'react'
import * as renderer from 'react-test-renderer'

import Brandkit from '../../../pages/experience/brand/index'

describe('Experience/Brandkit', () => {
  it('renders', () => {
    const tree = renderer.create(<Brandkit />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
