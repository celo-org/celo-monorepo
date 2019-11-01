import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import VerificationSuccessScreen from 'src/verify/VerificationSuccessScreen'
import { createMockStore } from 'test/utils'

describe('VerificationSuccessScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <VerificationSuccessScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
