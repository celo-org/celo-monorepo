import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import Pincode from 'src/pincode/Pincode'
import { createMockStore } from 'test/utils'

describe('Pincode', () => {
  it('renders correctly', () => {
    const { toJSON, getByTestId } = render(
      <Provider store={createMockStore()}>
        <Pincode />
      </Provider>
    )

    // initial - education
    expect(toJSON()).toMatchSnapshot()

    // Press continue
    fireEvent.press(getByTestId('Pincode-Education'))
    expect(toJSON()).toMatchSnapshot()

    fireEvent.press(getByTestId('Pincode-Enter'))
    expect(toJSON()).toMatchSnapshot()

    fireEvent.press(getByTestId('Pincode-ReEnter'))
    expect(toJSON()).toMatchSnapshot()
  })
})
