import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import VerificationLearnMoreScreen from 'src/verify/VerificationLearnMoreScreen'
import { createMockStore } from 'test/utils'

describe('VerificationLearnMoreScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <VerificationLearnMoreScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
