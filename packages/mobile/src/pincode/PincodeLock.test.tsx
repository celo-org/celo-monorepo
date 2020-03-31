import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { showError } from 'src/alert/actions'
import { appUnlock } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import PincodeLock from 'src/pincode/PincodeLock'
import { isPinCorrect } from 'src/pincode/utils'
import { createMockStore } from 'test/utils'

describe('PincodeLock', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <PincodeLock />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('unlocks if PIN is correct', (done) => {
    const pin = '123456'
    ;(isPinCorrect as jest.Mock).mockResolvedValueOnce(pin)
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeLock />
      </Provider>
    )
    fireEvent.press(getByTestId('Pincode-Submit'))

    jest.useRealTimers()
    setTimeout(() => {
      expect(store.getActions()).toEqual([appUnlock()])
      done()
    })
    jest.useFakeTimers()
  })

  it('shows wrong PIN notification', (done) => {
    ;(isPinCorrect as jest.Mock).mockRejectedValue('')
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeLock />
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
