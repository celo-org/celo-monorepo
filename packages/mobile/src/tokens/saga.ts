import { retryAsync } from '@celo/utils/src/async'
import { getErc20Balance, getGoldTokenContract, getStableTokenContract } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { call, put, take, takeEvery } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { addStandbyTransaction, removeStandbyTransaction } from 'src/transactions/actions'
import { TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import * as utf8 from 'utf8'

const TAG = 'tokens/saga'

interface TokenFetchFactory {
  actionName: string
  contractGetter: (web3: any) => any
  actionCreator: (balance: string) => any
  tag: string
}

export function tokenFetchFactory({
  actionName,
  contractGetter,
  actionCreator,
  tag,
}: TokenFetchFactory) {
  function* tokenFetch() {
    try {
      Logger.debug(tag, 'Fetching balance')
      const account = yield call(getConnectedAccount)
      const tokenContract = yield call(contractGetter, web3)
      const balance = yield call(getErc20Balance, tokenContract, account, web3)
      CeloAnalytics.track(CustomEventNames.fetch_balance)
      yield put(actionCreator(balance.toString()))
    } catch (error) {
      Logger.error(tag, 'Error fetching balance', error)
    }
  }

  return function*() {
    return yield takeEvery(actionName, tokenFetch)
  }
}

export interface BasicTokenTransfer {
  recipientAddress: string
  amount: string
  comment: string
}

export interface TokenTransfer {
  recipientAddress: string
  amount: string
  comment: string
  txId: string
}

export type TokenTransferAction = { type: string } & TokenTransfer

interface TokenTransferFactory {
  actionName: string
  contractGetter: typeof getStableTokenContract | typeof getGoldTokenContract
  tag: string
  currency: CURRENCY_ENUM
  fetchAction: () => any
}

// TODO(martinvol) this should go to the SDK
export async function createTransaction(
  contractGetter: typeof getStableTokenContract | typeof getGoldTokenContract,
  transferAction: BasicTokenTransfer
) {
  const { recipientAddress, amount, comment } = transferAction

  // TODO(cmcewen): Use proper typing when there is a common interface
  const tokenContract = await contractGetter(web3) // TODO(martinvol) add types specially here
  const decimals: string = await tokenContract.methods.decimals().call()
  const decimalBigNum = new BigNumber(decimals)
  const decimalFactor = new BigNumber(10).pow(decimalBigNum.toNumber())
  const convertedAmount = new BigNumber(amount).multipliedBy(decimalFactor)

  const tx = tokenContract.methods.transferWithComment(
    recipientAddress,
    convertedAmount.toString(),
    utf8.encode(comment)
  )

  return tx
}

export async function fetchTokenBalanceWithRetry(
  contractGetter: typeof getStableTokenContract | typeof getGoldTokenContract,
  account: string
) {
  Logger.debug(TAG + '@fetchTokenBalanceWithRetry', 'Checking account balance', account)
  const tokenContract = await contractGetter(web3)
  // Retry needed here because it's typically the app's first tx and seems to fail on occasion
  const tokenBalance = await retryAsync(tokenContract.methods.balanceOf(account).call, 3, [])
  Logger.debug(TAG + '@fetchTokenBalanceWithRetry', 'Account balance', tokenBalance)
  return new BigNumber(tokenBalance)
}

export function tokenTransferFactory({
  actionName,
  contractGetter,
  tag,
  currency,
  fetchAction,
}: TokenTransferFactory) {
  return function*() {
    while (true) {
      const transferAction: TokenTransferAction = yield take(actionName)
      const { recipientAddress, amount, comment, txId } = transferAction

      Logger.debug(tag, 'Transferring token', amount, txId)

      yield put(
        addStandbyTransaction({
          id: txId,
          type: TransactionTypes.SENT,
          comment,
          status: TransactionStatus.Pending,
          value: amount.toString(),
          symbol: currency,
          timestamp: Math.floor(Date.now() / 1000),
          address: recipientAddress,
        })
      )

      try {
        const account = yield call(getConnectedUnlockedAccount)

        const tx = yield call(createTransaction, contractGetter, {
          recipientAddress,
          amount,
          comment,
        })

        yield call(sendAndMonitorTransaction, txId, tx, account, currency)
      } catch (error) {
        Logger.error(tag, 'Error transfering token', error)
        yield put(removeStandbyTransaction(txId))
        if (error.message === ErrorMessages.INCORRECT_PIN) {
          yield put(showError(ErrorMessages.INCORRECT_PIN))
        } else {
          yield put(showError(ErrorMessages.TRANSACTION_FAILED))
        }
      }
    }
  }
}
