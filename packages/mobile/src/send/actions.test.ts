import { Actions, setTransactionFee, SetTransactionFeeAction } from 'src/send/actions'

it('sets the transaction fee correctly', () => {
  const setPriceAction: SetTransactionFeeAction = setTransactionFee('fee')
  expect(setPriceAction.type).toBe(Actions.SET_TRANSACTION_FEE)
  expect(setPriceAction.suggestedFee).toBe('fee')
})
