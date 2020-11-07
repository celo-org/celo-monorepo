import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import Faucet from '../../../pages/developers/faucet'

jest.mock('next/config', () => {
  return () => ({ publicRuntimeConfig: { RECAPTCHA: 'AF0124020000' } })
})

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
