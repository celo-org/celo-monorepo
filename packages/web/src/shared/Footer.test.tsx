import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import Footer from './Footer'

describe('Footer', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Footer />
        </TestProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
