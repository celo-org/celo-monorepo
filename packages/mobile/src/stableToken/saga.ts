import { spawn } from 'redux-saga/effects'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Actions, fetchDollarBalance, setBalance } from 'src/stableToken/actions'
import { tokenFetchFactory, tokenTransferFactory } from 'src/tokens/saga'

const tag = 'stableToken/saga'

export const stableTokenFetch = tokenFetchFactory({
  actionName: Actions.FETCH_BALANCE,
  token: CURRENCY_ENUM.DOLLAR,
  actionCreator: setBalance,
  tag,
})

export const stableTokenTransfer = tokenTransferFactory({
  actionName: Actions.TRANSFER,
  tag,
  currency: CURRENCY_ENUM.DOLLAR,
  fetchAction: fetchDollarBalance,
})

export function* stableTokenSaga() {
  yield spawn(stableTokenFetch)
  yield spawn(stableTokenTransfer)
}
