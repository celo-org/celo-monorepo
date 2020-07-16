import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { VerificationStatus } from 'src/identity/types'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import { createMockStore } from 'test/utils'

// Mocking the carousel since it seems to cause transient snapshot failures
jest.mock('react-native-snap-carousel')

describe('VerificationLoadingScreen', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore()}>
        <VerificationLoadingScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with fail modal', () => {
    const store = createMockStore({
      identity: {
        verificationStatus: VerificationStatus.Failed,
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <VerificationLoadingScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
