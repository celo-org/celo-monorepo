import FAQ from 'pages/faq'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('FAQ', () => {
  it('renders', () => {
    const tree = renderer.create(<FAQ />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
