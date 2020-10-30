import * as React from 'react'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { appUnlock } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces } from 'src/i18n'
import { checkPin } from 'src/pincode/authentication'
import PincodeLock from 'src/pincode/PincodeLock'
import { createMockStore } from 'test/utils'

const pin = '123456'

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

  it('unlocks if PIN is correct', async () => {
    ;(checkPin as jest.Mock).mockResolvedValueOnce(true)
    const store = createMockStore()

    const { getByTestId } = render(
      <Provider store={store}>
        <PincodeLock />
      </Provider>
    )
    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(store.getActions()).toEqual([appUnlock()])
  })

  it('shows wrong PIN notification', async () => {
    ;(checkPin as jest.Mock).mockResolvedValue(false)
    const store = createMockStore()

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <PincodeLock />
      </Provider>
    )
    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runAllTimers()
    await flushMicrotasksQueue()
    expect(getByText(`${Namespaces.global}:${ErrorMessages.INCORRECT_PIN}`)).toBeDefined()
    expect(store.getActions()).toEqual([])
  })
})
