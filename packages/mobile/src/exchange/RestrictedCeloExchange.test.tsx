import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import RestrictedCeloExchange from 'src/exchange/RestrictedCeloExchange'

describe('RestrictedCeloExchange', () => {
  it('renders correctly', () => {
    const onPressWithdraw = jest.fn()
    const tree = render(<RestrictedCeloExchange onPressWithdraw={onPressWithdraw} />)
    expect(tree).toMatchSnapshot()
    expect(onPressWithdraw).not.toHaveBeenCalled()

    fireEvent.press(tree.getByTestId('WithdrawCELO'))
    expect(onPressWithdraw).toHaveBeenCalled()
  })
})
