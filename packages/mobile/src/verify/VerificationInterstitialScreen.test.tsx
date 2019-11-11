import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import VerificationInterstitialScreen from 'src/verify/VerificationInterstitialScreen'
import { createMockStore } from 'test/utils'

describe('VerificationInterstitialScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <VerificationInterstitialScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
