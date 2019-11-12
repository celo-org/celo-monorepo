import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import { createMockStore } from 'test/utils'

describe('VerificationInputScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const { toJSON, queryByTestId } = render(
      <Provider store={store}>
        <VerificationInputScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
    expect(queryByTestId('noTypeTip')).toBeFalsy()

    // TODO find way to simulate keyboard showing
    // expect(queryByTestId('noTypeTip')).toBeTruthy()
  })

  it('enables button after timer', () => {
    // TODO
  })
})
