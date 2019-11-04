import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import { createMockStore } from 'test/utils'

describe('VerificationLoadingScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <VerificationLoadingScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('updates progress bar', () => {
    // TODO
  })
})
