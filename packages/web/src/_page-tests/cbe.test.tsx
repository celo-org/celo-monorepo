import CBE from 'pages/coinbase-earn'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('CBE', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <CBE />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
