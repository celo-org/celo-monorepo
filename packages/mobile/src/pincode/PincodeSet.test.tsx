import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import PincodeSet from 'src/pincode/PincodeSet'
import { createMockStore } from 'test/utils'

describe('Pincode', () => {
  it('renders correctly', () => {
    const { toJSON, getByTestId } = render(
      <Provider store={createMockStore()}>
        <PincodeSet />
      </Provider>
    )

    // initial render shows pin enter screen
    expect(toJSON()).toMatchSnapshot()

    // second render shows pin re-enter set screen
    fireEvent.press(getByTestId('Pincode-Enter'))
    expect(toJSON()).toMatchSnapshot()
  })
})
