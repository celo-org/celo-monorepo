import Alliance from 'pages/alliance'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('Alliance', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Alliance />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
