import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import { createMockStore } from 'test/utils'

describe('VerificationInputScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <VerificationInputScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('enables button after timer', () => {
    // TODO
  })

  it('shows tip when typing', () => {
    // TODO
  })
})
