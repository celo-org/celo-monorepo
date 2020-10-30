import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import ValidatorPage from '../../../pages/validators/index'

describe('BuildPage', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <ValidatorPage />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
