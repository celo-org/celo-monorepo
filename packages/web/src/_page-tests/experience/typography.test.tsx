import * as React from 'react'
import * as renderer from 'react-test-renderer'

import Typography from '../../../pages/experience/brand/typography'

describe('Experience/Typography', () => {
  it('renders', () => {
    const tree = renderer.create(<Typography />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
