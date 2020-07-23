import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { VerificationStatus } from 'src/identity/types'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import { createMockStore } from 'test/utils'

// Mock AnimatedScrollView this way otherwise we get a
// `JavaScript heap out of memory` error when ref is set (?!)
jest.mock(
  'react-native/Libraries/Animated/src/components/AnimatedScrollView.js',
  () => 'RCTScrollView'
)

// Lock time so snapshots always show the same countdown value
jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)

describe('VerificationLoadingScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore()}>
        <VerificationLoadingScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with fail modal', () => {
    const store = createMockStore({
      identity: {
        verificationStatus: VerificationStatus.Failed,
      },
    })
    const { toJSON } = render(
      <Provider store={store}>
        <VerificationLoadingScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
