import * as React from 'react'
import * as renderer from 'react-test-renderer'

import Icons from '../../../pages/experience/brand/icons'

describe('Experience/Icons', () => {
  it('renders', () => {
    const tree = renderer.create(<Icons />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
