import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Screens } from 'src/navigator/Screens'
import PincodeEnter from 'src/pincode/PincodeEnter'
import { isPinCorrect } from 'src/pincode/utils'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.PincodeEnter, {
  withVerification: true,
  onSuccess: jest.fn(),
})

describe('PincodeEnter', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <PincodeEnter {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('calls onSuccess when PIN is correct', (done) => {
    const pin = '123456'
    ;(isPinCorrect as jest.Mock).mockResolvedValueOnce(pin)
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeEnter {...mockScreenProps} />
      </Provider>
    )
    fireEvent.press(getByTestId('Pincode-Submit'))

    jest.useRealTimers()
    setTimeout(() => {
      expect(mockScreenProps.route.params.onSuccess).toBeCalledWith(pin)
      done()
    })
    jest.useFakeTimers()
  })

  it('shows wrong PIN notification', (done) => {
    ;(isPinCorrect as jest.Mock).mockRejectedValueOnce('')
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeEnter {...mockScreenProps} />
      </Provider>
    )
    fireEvent.press(getByTestId('Pincode-Submit'))

    jest.useRealTimers()
    setTimeout(() => {
      expect(store.getActions()).toEqual([showError(ErrorMessages.INCORRECT_PIN)])
      done()
    })
    jest.useFakeTimers()
  })
})
