import { Actions, setTransactionFee, SetTransactionFeeAction } from 'src/send/actions'

it('sets the transaction fee correctly', () => {
  const setPriceAction: SetTransactionFeeAction = setTransactionFee('fee')
  expect(setPriceAction.type).toBe(Actions.SET_TRANSACTION_FEE)
  expect(setPriceAction.suggestedFee).toBe('fee')
})

describe('updateSuggestedFee', () => {
  // TODO(martinvol) with #3881 after it's refactored to a saga
  // it('updates the suggested fee for verified Contacts', async () => {
  //   const mockDispatch = jest.fn((x) => 10)
  //   const suggestedFee = await updateSuggestedFee(true, )(mockDispatch)
  //   expect(suggestedFee).not.toBe(undefined)
  //   if (suggestedFee) {
  //     expect(suggestedFee.toString()).toBe('0')
  //   }
  //   const action = mockDispatch.mock.calls[0][0]
  //   expect(action.type).toBe(Actions.SET_TRANSACTION_FEE)
  //   expect(action).toEqual(setTransactionFee('0'))
  // })
})
