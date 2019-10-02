import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { createMockStore, createMockStoreAppDisconnected } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

it('renders banner when app is disconnected', () => {
  const store = createMockStoreAppDisconnected()
  const tree = renderer.create(
    <Provider store={store}>
      <DisconnectBanner />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders nothing when connected', () => {
  const store = createMockStore()
  const tree = renderer.create(
    <Provider store={store}>
      <DisconnectBanner />
    </Provider>
  )
  expect(tree.toJSON()).toBeNull()
})
