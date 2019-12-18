import * as React from 'react'
import * as renderer from 'react-test-renderer'

import Logo from './logo'

describe('Experience/Logo', () => {
  it('renders', () => {
    const tree = renderer.create(<Logo />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
