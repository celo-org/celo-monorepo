import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import PincodeEnter from 'src/pincode/PincodeEnter'
import { isPinCorrect } from 'src/pincode/utils'
import { createMockNavigationProp, createMockStore } from 'test/utils'

describe('PincodeEnter', () => {
  it('renders correctly', () => {
    const navigation = createMockNavigationProp({
      reject: jest.fn(),
      resolve: jest.fn(),
    })

    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <PincodeEnter navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('calls onSuccess when PIN is correct', (done) => {
    const pin = '123456'
    const onSuccess = jest.fn()
    const navigation = createMockNavigationProp(onSuccess)
    ;(isPinCorrect as jest.Mock).mockResolvedValueOnce(pin)
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeEnter navigation={navigation} />
      </Provider>
    )
    fireEvent.press(getByTestId('Pincode-Submit'))

    jest.useRealTimers()
    setTimeout(() => {
      expect(onSuccess).toBeCalledWith(pin)
      done()
    })
    jest.useFakeTimers()
  })

  it('shows wrong PIN notification', (done) => {
    const navigation = createMockNavigationProp({})
    ;(isPinCorrect as jest.Mock).mockRejectedValueOnce('')
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeEnter navigation={navigation} />
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
