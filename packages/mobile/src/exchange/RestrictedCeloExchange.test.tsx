import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import RestrictedCeloExchange from 'src/exchange/RestrictedCeloExchange'
import { createMockStore } from 'test/utils'

describe('RestrictedCeloExchange', () => {
  it('allows withdrawing if the balance is enough', () => {
    const store = createMockStore({
      goldToken: { balance: '10' },
      stableToken: { balance: '10' },
    })
    const onPressWithdraw = jest.fn()

    const tree = render(
      <Provider store={store}>
        <RestrictedCeloExchange onPressWithdraw={onPressWithdraw} />
      </Provider>
    )

    expect(onPressWithdraw).not.toHaveBeenCalled()

    fireEvent.press(tree.getByTestId('WithdrawCELO'))
    expect(onPressWithdraw).toHaveBeenCalled()
  })

  it('disallows withdrawing if the balance is NOT enough', () => {
    const store = createMockStore({
      goldToken: { balance: '0.001' },
    })
    const onPressWithdraw = jest.fn()

    const tree = render(
      <Provider store={store}>
        <RestrictedCeloExchange onPressWithdraw={onPressWithdraw} />
      </Provider>
    )

    expect(onPressWithdraw).not.toHaveBeenCalled()
    expect(tree.queryByTestId('WithdrawCELO')).toBeFalsy()
  })
})
