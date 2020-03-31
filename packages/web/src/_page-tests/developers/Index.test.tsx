import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import DevelopersPage from '../../../pages/developers/index'

describe('DevelopersPage', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <DevelopersPage />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
