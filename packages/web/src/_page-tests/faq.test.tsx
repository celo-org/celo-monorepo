import * as React from 'react'
import * as renderer from 'react-test-renderer'
import FAQ from '../../pages/faq'

describe('FAQ', () => {
  it('renders', () => {
    const tree = renderer.create(<FAQ />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
