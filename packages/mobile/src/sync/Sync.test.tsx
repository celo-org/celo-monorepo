import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { Sync } from 'src/sync/Sync'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('react-native-firebase')

const store = createMockStore()

it('renders correctly when dev Mode disabled', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <Sync
        isWeb3Ready={false}
        syncProgress={24}
        checkSyncProgress={jest.fn()}
        pincodeSet={false}
        {...getMockI18nProps()}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when dev Mode enabled', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <Sync
        isWeb3Ready={false}
        syncProgress={24}
        checkSyncProgress={jest.fn()}
        pincodeSet={false}
        {...getMockI18nProps()}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
