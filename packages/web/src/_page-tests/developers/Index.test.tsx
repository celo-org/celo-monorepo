import * as React from 'react'
import * as renderer from 'react-test-renderer'
import DevelopersPage from '../../../pages/developers/index'
import { TestProvider } from 'src/_page-tests/test-utils'

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
