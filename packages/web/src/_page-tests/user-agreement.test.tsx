import UserAgreement from 'pages/user-agreement'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('UserAgreement', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <UserAgreement />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
