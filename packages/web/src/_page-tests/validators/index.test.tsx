import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import BuildPage from '../../../pages/validators/index'

describe('BuildPage', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <BuildPage />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
