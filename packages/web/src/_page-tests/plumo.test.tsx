import PlumoLanding from 'pages/plumo'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('PlumoLanding', () => {
  it('renders', async () => {
    const tree = renderer
      .create(
        <TestProvider>
          <PlumoLanding />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
