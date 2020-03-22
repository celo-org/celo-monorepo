import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Terms from '../../../pages/stake-off/terms'
import { TestProvider } from 'src/_page-tests/test-utils'

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
