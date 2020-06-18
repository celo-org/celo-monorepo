import * as React from 'react'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PincodeSet from 'src/pincode/PincodeSet'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet)

const pin = '123456'

describe('Pincode', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore()}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // initial render shows pin enter screen
    expect(toJSON()).toMatchSnapshot()
  })

  it('navigates to the EnterInviteCode screen after successfully verifying', async () => {
    const store = createMockStore()

    const { getByTestId, rerender } = render(
      <Provider store={store}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(mockScreenProps.navigation.setParams).toBeCalledWith({ isVerifying: true })

    rerender(
      <Provider store={store}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet, { isVerifying: true })} />
      </Provider>
    )

    // Verify pin
    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(navigate).toBeCalledWith(Screens.EnterInviteCode)
  })

  it("displays an error text when the pins don't match", async () => {
    const store = createMockStore()

    const { getByTestId, getByText, rerender } = render(
      <Provider store={store}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(mockScreenProps.navigation.setParams).toBeCalledWith({ isVerifying: true })

    rerender(
      <Provider store={store}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet, { isVerifying: true })} />
      </Provider>
    )

    // Verify with incorrect pin
    '555555'.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(getByText('pincodeSet.pinsDontMatch')).toBeDefined()
  })
})
