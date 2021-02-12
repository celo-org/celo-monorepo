import { RehydrateAction } from 'redux-persist'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Actions, ActionTypes } from 'src/fiatExchanges/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

interface ProviderFeedInfo {
  name: string
  icon: string
}

export interface State {
  lastUsedProvider: ProviderFeedInfo | null
  txHashToProvider: { [txHash: string]: ProviderFeedInfo | undefined }
}

export const initialState = {
  lastUsedProvider: null,
  txHashToProvider: {},
}

export const reducer = (state: State = initialState, action: ActionTypes | RehydrateAction) => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        ...getRehydratePayload(action, 'fiatExchanges'),
      }
    }
    case Actions.SELECT_PROVIDER:
      return {
        ...state,
        lastUsedProvider: {
          name: action.name,
          icon: action.icon,
        },
      }
    case Actions.ASSIGN_PROVIDER_TO_TX_HASH:
      let providerToAssign = state.lastUsedProvider
      ValoraAnalytics.track(FiatExchangeEvents.cash_in_success, {
        provider: providerToAssign?.name || 'unknown',
        currency: action.currencyCode,
      })
      if (!providerToAssign) {
        const nameKey =
          action.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
            ? 'fiatExchangeFlow:celoDeposit'
            : 'fiatExchangeFlow:cUsdDeposit'
        providerToAssign = {
          name: i18n.t(nameKey),
          icon:
            'https://firebasestorage.googleapis.com/v0/b/celo-mobile-alfajores.appspot.com/o/images%2Fcelo.jpg?alt=media',
        }
      }
      return {
        ...state,
        lastUsedProvider: null,
        txHashToProvider: {
          ...state.txHashToProvider,
          [action.txHash]: providerToAssign,
        },
      }
    default:
      return state
  }
}

export const txHashToFeedInfoSelector = (state: RootState) => state.fiatExchanges.txHashToProvider
