import Audits from 'pages/audits'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('Audits', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Audits />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
