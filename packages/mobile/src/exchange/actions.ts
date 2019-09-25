import {
  ContractUtils,
  getExchangeContract,
  getGoldTokenContract,
  getStableTokenContract,
} from '@celo/walletkit'
import { Exchange as ExchangeType } from '@celo/walletkit/types/Exchange'
import { GoldToken as GoldTokenType } from '@celo/walletkit/types/GoldToken'
import { StableToken as StableTokenType } from '@celo/walletkit/types/StableToken'
import BigNumber from 'bignumber.js'
import { call, put, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
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

const TAG = 'exchange/actions'
const LARGE_DOLLARS_SELL_AMOUNT_IN_WEI = new BigNumber(1000 * 1000000000000000000) // To estimate exchange rate from exchange contract
const LARGE_GOLD_SELL_AMOUNT_IN_WEI = new BigNumber(100 * 1000000000000000000)
const EXCHANGE_DIFFERENCE_TOLERATED = 0.01 // Maximum difference between actual and displayed takerAmount

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

export function* doFetchExchangeRate(makerAmount?: BigNumber, makerToken?: CURRENCY_ENUM) {
  Logger.debug(TAG, 'Calling @doFetchExchangeRate')

  let dollarMakerAmount: BigNumber
  let goldMakerAmount: BigNumber
  if (makerAmount && makerToken === CURRENCY_ENUM.GOLD) {
    dollarMakerAmount = LARGE_DOLLARS_SELL_AMOUNT_IN_WEI
    goldMakerAmount = makerAmount
  } else if (makerAmount && makerToken === CURRENCY_ENUM.DOLLAR) {
    dollarMakerAmount = makerAmount
    goldMakerAmount = LARGE_GOLD_SELL_AMOUNT_IN_WEI
  } else {
    dollarMakerAmount = LARGE_DOLLARS_SELL_AMOUNT_IN_WEI
    goldMakerAmount = LARGE_GOLD_SELL_AMOUNT_IN_WEI
    if (makerAmount || makerToken) {
      Logger.debug(
        TAG,
        'Using default makerAmount estimates. Need both makerAmount and makerToken to override. '
      )
    }
  }

  try {
    yield call(getConnectedAccount)

    const dollarMakerExchangeRate: BigNumber = yield call(
      ContractUtils.getExchangeRate,
      web3,
      CURRENCY_ENUM.DOLLAR,
      new BigNumber(dollarMakerAmount)
    )
    const goldMakerExchangeRate: BigNumber = yield call(
      ContractUtils.getExchangeRate,
      web3,
      CURRENCY_ENUM.GOLD,
      new BigNumber(goldMakerAmount)
    )

    if (!dollarMakerExchangeRate || !goldMakerExchangeRate) {
      Logger.error(TAG, 'Invalid exchange rate')
      throw new Error('Invalid exchange rate')
    }

    Logger.debug(
      TAG,
      `Retrieved exchange rate: 
      ${dollarMakerExchangeRate.toString()} gold per dollar, estimated at ${dollarMakerAmount}
      ${goldMakerExchangeRate.toString()} dollar per gold, estimated at ${goldMakerAmount}`
    )

    yield put(
      setExchangeRate({
        goldMaker: goldMakerExchangeRate.toString(),
        dollarMaker: dollarMakerExchangeRate.toString(),
      })
    )
  } catch (error) {
    Logger.error(TAG, 'Error fetching exchange rate', error)
    yield put(showError(ErrorMessages.EXCHANGE_RATE_FAILED))
  }
}

export function* exchangeGoldAndStableTokens(action: ExchangeTokensAction) {
  Logger.debug(`${TAG}@exchangeGoldAndStableTokens`, 'Exchanging gold and stable CURRENCY_ENUM')
  const { makerToken, makerAmount } = action
  Logger.debug(TAG, `Exchanging ${makerAmount.toString()} of CURRENCY_ENUM ${makerToken}`)
  let txId: string | null = null
  try {
    const account: string = yield call(getConnectedUnlockedAccount)
    const exchangeRatePair: ExchangeRatePair = yield select(
      (state: RootState) => state.exchange.exchangeRatePair
    )
    const exchangeRate = getRateForMakerToken(exchangeRatePair, makerToken)
    if (!exchangeRate) {
      Logger.error(TAG, 'Invalid exchange rate from exchange contract')
      return
    }
    if (exchangeRate.isZero()) {
      Logger.error(TAG, 'Cannot do exchange with rate of 0. Stopping.')
      throw new Error('Invalid exchange rate')
    }

    txId = yield createStandbyTx(makerToken, makerAmount, exchangeRate, account)

    const goldTokenContract: GoldTokenType = yield call(getGoldTokenContract, web3)
    const stableTokenContract: StableTokenType = yield call(getStableTokenContract, web3)
    const exchangeContract: ExchangeType = yield call(getExchangeContract, web3)

    const makerTokenContract =
      makerToken === CURRENCY_ENUM.DOLLAR ? stableTokenContract : goldTokenContract

    const convertedMakerAmount: BigNumber = yield call(
      convertToContractDecimals,
      makerAmount,
      makerTokenContract
    )
    const sellGold = makerToken === CURRENCY_ENUM.GOLD

    const updatedExchangeRate: BigNumber = yield call(
      // Updating with actual makerAmount, rather than conservative estimate displayed
      ContractUtils.getExchangeRate,
      web3,
      makerToken,
      convertedMakerAmount
    )

    const exceedsExpectedSize =
      makerToken === CURRENCY_ENUM.GOLD
        ? convertedMakerAmount.isGreaterThan(LARGE_GOLD_SELL_AMOUNT_IN_WEI)
        : convertedMakerAmount.isGreaterThan(LARGE_DOLLARS_SELL_AMOUNT_IN_WEI)

    if (exceedsExpectedSize) {
      Logger.error(
        TAG,
        `Displayed exchange rate was estimated with a smaller makerAmount than actual ${convertedMakerAmount}`
      )
      // Note that exchange will still go through if makerAmount difference is within EXCHANGE_DIFFERENCE_TOLERATED
    }

    // Ensure the user gets makerAmount at least as good as displayed (rounded to EXCHANGE_DIFFERENCE_TOLERATED)
    const minimumTakerAmount = getTakerAmount(makerAmount, exchangeRate).minus(
      EXCHANGE_DIFFERENCE_TOLERATED
    )
    const updatedTakerAmount = getTakerAmount(makerAmount, updatedExchangeRate)
    if (minimumTakerAmount.isGreaterThan(updatedTakerAmount)) {
      Logger.error(
        TAG,
        `Not receiving enough ${makerToken} due to change in exchange rate. Exchange failed.`
      )
      yield put(showError(ErrorMessages.EXCHANGE_RATE_CHANGE))
      return
    }

    const takerTokenContract =
      makerToken === CURRENCY_ENUM.DOLLAR ? goldTokenContract : stableTokenContract
    const convertedTakerAmount: BigNumber = roundDown(
      yield call(convertToContractDecimals, minimumTakerAmount, takerTokenContract),
      0
    )
    Logger.debug(
      TAG,
      `Will receive at least ${convertedTakerAmount} 
      wei for ${convertedMakerAmount} wei of ${makerToken}`
    )

    let approveTx
    if (makerToken === CURRENCY_ENUM.GOLD) {
      approveTx = goldTokenContract.methods.approve(
        exchangeContract._address,
        convertedMakerAmount.toString()
      )
    } else if (makerToken === CURRENCY_ENUM.DOLLAR) {
      approveTx = stableTokenContract.methods.approve(
        exchangeContract._address,
        convertedMakerAmount.toString()
      )
    } else {
      Logger.error(TAG, `Unexpected maker token ${makerToken}`)
      return
    }
    yield call(sendTransaction, approveTx, account, TAG, 'approval')
    Logger.debug(TAG, `Transaction approved: ${approveTx}`)

    const tx = exchangeContract.methods.exchange(
      convertedMakerAmount.toString(),
      convertedTakerAmount.toString(),
      sellGold
    )

    if (!txId) {
      Logger.error(TAG, 'No txId. Did not exchange.')
      return
    }
    yield call(sendAndMonitorTransaction, txId, tx, account)
  } catch (error) {
    Logger.error(TAG, 'Error doing exchange', error)
    yield put(showError(ErrorMessages.EXCHANGE_FAILED))
    if (txId) {
      yield put(removeStandbyTransaction(txId))
    }
  }
}

function* createStandbyTx(
  makerToken: CURRENCY_ENUM,
  makerAmount: BigNumber,
  exchangeRate: BigNumber,
  account: string
) {
  const takerAmount = getTakerAmount(makerAmount, exchangeRate, 2)
  const txId = generateStandbyTransactionId(account)
  yield put(
    addStandbyTransaction({
      id: txId,
      type: TransactionTypes.EXCHANGE,
      status: TransactionStatus.Pending,
      inSymbol: makerToken,
      inValue: makerAmount.toString(),
      outSymbol: makerToken === CURRENCY_ENUM.DOLLAR ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR,
      outValue: takerAmount.toString(),
      timestamp: Math.floor(Date.now() / 1000),
    })
  )
  return txId
}

async function convertToContractDecimals(value: BigNumber | string | number, contract: any) {
  // TODO(Rossy): Move this function to SDK and cache this decimals amount
  const decimals = await contract.methods.decimals().call()
  const one = new BigNumber(10).pow(new BigNumber(decimals).toNumber())
  return one.times(value)
}
