import { Action, combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { Actions } from 'src/account/actions'
import { reducer as account, State as AccountState } from 'src/account/reducer'
import { reducer as alert, State as AlertState } from 'src/alert/reducer'
import { appReducer as app, State as AppState } from 'src/app/reducers'
import { escrowReducer as escrow, State as EscrowState } from 'src/escrow/reducer'
import { reducer as exchange, State as ExchangeState } from 'src/exchange/reducer'
import { reducer as fees, State as FeesState } from 'src/fees/reducer'
import { gethReducer as geth, State as GethState } from 'src/geth/reducer'
import { reducer as goldToken, State as GoldTokenState } from 'src/goldToken/reducer'
import { homeReducer as home, State as HomeState } from 'src/home/reducers'
import { reducer as identity, State as IdentityState } from 'src/identity/reducer'
import { reducer as imports, State as ImportState } from 'src/import/reducer'
import { inviteReducer as invite, State as InviteState } from 'src/invite/reducer'
import { reducer as localCurrency, State as LocalCurrencyState } from 'src/localCurrency/reducer'
import { reducer as networkInfo, State as NetworkInfoState } from 'src/networkInfo/reducer'
import { reducer as paymentRequest, State as PaymentRequestState } from 'src/paymentRequest/reducer'
import { recipientsReducer as recipients, State as RecipientsState } from 'src/recipients/reducer'
import { sendReducer as send, State as SendState } from 'src/send/reducers'
import { reducer as stableToken, State as StableTokenState } from 'src/stableToken/reducer'
import { reducer as transactions, State as TransactionsState } from 'src/transactions/reducer'
import { reducer as web3, State as Web3State } from 'src/web3/reducer'

const appReducer = combineReducers({
  app,
  networkInfo,
  alert,
  goldToken,
  stableToken,
  send,
  home,
  exchange,
  transactions,
  web3,
  identity,
  account,
  invite,
  geth,
  escrow,
  fees,
  recipients,
  localCurrency,
  imports,
  paymentRequest,
}) as (state: RootState | undefined, action: Action) => RootState

const rootReducer = (state: RootState | undefined, action: Action): RootState => {
  if (action.type === Actions.CLEAR_STORED_ACCOUNT && state) {
    // Generate an initial state but keep the information not specific to the account
    // that we want to save.
    const initialState = appReducer(undefined, action)
    return {
      ...initialState,
      // We keep the chosen currency since it's unlikely the user wants to change that.
      localCurrency: state.localCurrency,
      // We keep phone number mappings since there's a cost to fetch them and they are
      // likely to be the same on the same device.
      identity: identity(state.identity, action),
    }
  }
  return appReducer(state, action)
}

export default rootReducer

export interface RootState {
  _persist: PersistState
  app: AppState
  networkInfo: NetworkInfoState
  alert: AlertState
  send: SendState
  goldToken: GoldTokenState
  stableToken: StableTokenState
  home: HomeState
  exchange: ExchangeState
  transactions: TransactionsState
  web3: Web3State
  identity: IdentityState
  account: AccountState
  invite: InviteState
  geth: GethState
  escrow: EscrowState
  fees: FeesState
  recipients: RecipientsState
  localCurrency: LocalCurrencyState
  imports: ImportState
  paymentRequest: PaymentRequestState
}

export interface PersistedRootState {
  _persist: PersistState
  app: AppState
  send: SendState
  goldToken: GoldTokenState
  stableToken: StableTokenState
  transactions: TransactionsState
  web3: Web3State
  identity: IdentityState
  account: AccountState
  invite: InviteState
  escrow: EscrowState
  localCurrency: LocalCurrencyState
}
