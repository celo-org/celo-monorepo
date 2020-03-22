import FAQ from 'pages/faq'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('FAQ', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <FAQ />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
