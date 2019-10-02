import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Debug from 'src/app/Debug'
import { createMockStore } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('Debug', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore()}>
        <Debug />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
