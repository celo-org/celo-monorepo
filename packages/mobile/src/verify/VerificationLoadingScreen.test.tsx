import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { VerificationStatus } from 'src/identity/types'
import { Screens } from 'src/navigator/Screens'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

// Mock AnimatedScrollView this way otherwise we get a
// `JavaScript heap out of memory` error when ref is set (?!)
jest.mock(
  'react-native/Libraries/Animated/src/components/AnimatedScrollView.js',
  () => 'RCTScrollView'
)

// Lock time so snapshots always show the same countdown value
jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)

const mockRoute = {
  name: Screens.VerificationLoadingScreen as Screens.VerificationLoadingScreen,
  key: '1',
  params: {
    withoutRevealing: false,
  },
}

describe('VerificationLoadingScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore()}>
        <VerificationLoadingScreen navigation={mockNavigation} route={mockRoute} />
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
        <VerificationLoadingScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
