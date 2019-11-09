import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import { createMockStore } from 'test/utils'

describe('VerificationEducationScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const { getByTestId, toJSON } = render(
      <Provider store={store}>
        <VerificationEducationScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()

    // And snapshot again after showing the modal
    const skipButton = getByTestId('VerificationEducationSkip')
    fireEvent.press(skipButton)
    expect(toJSON()).toMatchSnapshot()
  })
})
