import HomePage from 'pages/index'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('HomePage', () => {
  it('renders', async () => {
    const tree = renderer
      .create(
        <TestProvider>
          <HomePage isRestricted={true} />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
