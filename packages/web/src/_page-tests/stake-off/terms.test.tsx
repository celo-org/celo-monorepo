import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import Terms from '../../../pages/stake-off/terms'

describe('Terms', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Terms />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
