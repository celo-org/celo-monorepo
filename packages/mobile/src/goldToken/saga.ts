import { spawn } from 'redux-saga/effects'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Actions, fetchGoldBalance, setBalance } from 'src/goldToken/actions'
import { tokenFetchFactory, tokenTransferFactory } from 'src/tokens/saga'

const tag = 'goldToken/saga'

export const goldFetch = tokenFetchFactory({
  actionName: Actions.FETCH_BALANCE,
  token: CURRENCY_ENUM.GOLD,
  actionCreator: setBalance,
  tag,
})

export const goldTransfer = tokenTransferFactory({
  actionName: Actions.TRANSFER,
  tag,
  currency: CURRENCY_ENUM.GOLD,
  fetchAction: fetchGoldBalance,
})

export function* goldTokenSaga() {
  yield spawn(goldFetch)
  yield spawn(goldTransfer)
}
