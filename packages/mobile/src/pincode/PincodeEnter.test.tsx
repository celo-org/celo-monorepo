import * as React from 'react'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import PincodeEnter from 'src/pincode/PincodeEnter'
import { ensureCorrectPin } from 'src/pincode/utils'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.PincodeEnter, {
  withVerification: true,
  onSuccess: jest.fn(),
})

const pin = '123456'

describe('PincodeEnter', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <PincodeEnter {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('calls onSuccess when PIN is correct', async () => {
    ;(ensureCorrectPin as jest.Mock).mockResolvedValueOnce(pin)
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeEnter {...mockScreenProps} />
      </Provider>
    )

    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(mockScreenProps.route.params.onSuccess).toBeCalledWith(pin)
  })

  it('shows wrong PIN notification', async () => {
    ;(ensureCorrectPin as jest.Mock).mockRejectedValueOnce('')
    const store = createMockStore()

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <PincodeEnter {...mockScreenProps} />
      </Provider>
    )
    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(getByText(`${Namespaces.global}:${ErrorMessages.INCORRECT_PIN}`)).toBeDefined()
    expect(store.getActions()).toEqual([])
  })
})
