import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Faucet from '../../../pages/developers/faucet'
import { TestProvider } from 'src/_page-tests/test-utils'

describe('Faucet', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Faucet />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
