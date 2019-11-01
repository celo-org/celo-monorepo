import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import { createMockStore } from 'test/utils'

describe('VerificationEducationScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <VerificationEducationScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
