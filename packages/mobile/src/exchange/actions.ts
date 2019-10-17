import BigNumber from 'bignumber.js'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { RootState } from 'src/redux/reducers'
import {
  addStandbyTransaction,
  generateStandbyTransactionId,
  removeStandbyTransaction,
} from 'src/transactions/actions'
import { TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import { roundDown } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import * as util from 'util'

export enum Actions {
  FETCH_EXCHANGE_RATE = 'EXCHANGE/FETCH_EXCHANGE_RATE',
  SET_EXCHANGE_RATE = 'EXCHANGE/SET_EXCHANGE_RATE',
  EXCHANGE_TOKENS = 'EXCHANGE/EXCHANGE_TOKENS',
}

export const fetchExchangeRate = (makerAmount?: BigNumber, makerToken?: CURRENCY_ENUM) => ({
  type: Actions.FETCH_EXCHANGE_RATE,
  makerAmount,
  makerToken,
})

export interface SetExchangeRateAction {
  type: Actions.SET_EXCHANGE_RATE
  exchangeRatePair: ExchangeRatePair
}

export const setExchangeRate = (exchangeRatePair: ExchangeRatePair): SetExchangeRateAction => ({
  type: Actions.SET_EXCHANGE_RATE,
  exchangeRatePair,
})

export interface ExchangeTokensAction {
  type: Actions.EXCHANGE_TOKENS
  makerToken: CURRENCY_ENUM
  makerAmount: BigNumber
}

export const exchangeTokens = (
  makerToken: CURRENCY_ENUM,
  makerAmount: BigNumber
): ExchangeTokensAction => ({
  type: Actions.EXCHANGE_TOKENS,
  makerToken,
  makerAmount,
})
export type ActionTypes = SetExchangeRateAction | ExchangeTokensAction
