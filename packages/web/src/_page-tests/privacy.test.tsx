import Privacy from 'pages/privacy'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('Privacy', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Privacy />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
