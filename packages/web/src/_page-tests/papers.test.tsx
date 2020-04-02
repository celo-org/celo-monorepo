import Papers from 'pages/papers'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('Papers', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Papers />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
