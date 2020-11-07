import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import Wallet from '../../../pages/developers/wallet'

describe('Wallet', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Wallet />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
