import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, takeEvery, takeLatest } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Actions, ExchangeTokensAction, setExchangeRate } from 'src/exchange/actions'
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

const TAG = 'exchange/saga'

const LARGE_DOLLARS_SELL_AMOUNT_IN_WEI = new BigNumber(1000 * 1000000000000000000) // To estimate exchange rate from exchange contract
const LARGE_GOLD_SELL_AMOUNT_IN_WEI = new BigNumber(100 * 1000000000000000000)
const EXCHANGE_DIFFERENCE_TOLERATED = 0.01 // Maximum difference between actual and displayed takerAmount

export function* doFetchExchangeRate(makerAmount?: BigNumber, makerToken?: CURRENCY_ENUM) {
  Logger.debug(TAG, 'Calling @doFetchExchangeRate')

  // If makerAmount and makerToken are given, use them to estimate the exchange rate,
  // as exchange rate depends on amount sold. Else default to present large sell amount.
  const goldMakerAmount =
    makerAmount && makerToken === CURRENCY_ENUM.GOLD ? makerAmount : LARGE_GOLD_SELL_AMOUNT_IN_WEI
  const dollarMakerAmount =
    makerAmount && makerToken === CURRENCY_ENUM.DOLLAR
      ? makerAmount
      : LARGE_DOLLARS_SELL_AMOUNT_IN_WEI

  try {
    yield call(getConnectedAccount)

    const contractKit = newKitFromWeb3(web3)
    const exchange = yield contractKit.contracts.getExchange()

    const dollarMakerExchangeRate: BigNumber = yield exchange.getUsdExchangeRate(dollarMakerAmount)
    const goldMakerExchangeRate: BigNumber = yield exchange.getGoldExchangeRate(goldMakerAmount)

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
  Logger.debug(`${TAG}@exchangeGoldAndStableTokens`, 'Exchanging gold and stable token')
  const { makerToken, makerAmount } = action
  Logger.debug(TAG, `Exchanging ${makerAmount.toString()} of token ${makerToken}`)
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
    Logger.debug(TAG, `Transaction approved: ${util.inspect(approveTx.arguments)}`)

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
    if (txId) {
      yield put(removeStandbyTransaction(txId))
    }

    if (error.message === ErrorMessages.INCORRECT_PIN) {
      yield put(showError(ErrorMessages.INCORRECT_PIN))
    } else {
      yield put(showError(ErrorMessages.EXCHANGE_FAILED))
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

export function* watchFetchExchangeRate() {
  yield takeLatest(Actions.FETCH_EXCHANGE_RATE, doFetchExchangeRate)
}

export function* watchExchangeTokens() {
  // @ts-ignore saga doesn't seem to understand the action with multiple params?
  yield takeEvery(Actions.EXCHANGE_TOKENS, exchangeGoldAndStableTokens)
}

export function* exchangeSaga() {
  yield spawn(watchFetchExchangeRate)
  yield spawn(watchExchangeTokens)
}
