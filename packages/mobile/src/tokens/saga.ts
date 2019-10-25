import { retryAsync } from '@celo/utils/src/async'
import { getGoldTokenContract, getStableTokenContract } from '@celo/walletkit'
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
import { contractKit, web3 } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount, waitForWeb3Sync } from 'src/web3/saga'
import * as utf8 from 'utf8'

const TAG = 'tokens/saga'

// The number of wei that represent one unit in a contract
const contractWeiPerUnit: { [key in CURRENCY_ENUM]: BigNumber | null } = {
  [CURRENCY_ENUM.GOLD]: null,
  [CURRENCY_ENUM.DOLLAR]: null,
}

async function getWeiPerUnit(token: CURRENCY_ENUM) {
  let weiPerUnit = contractWeiPerUnit[token]
  if (!weiPerUnit) {
    const contract = await getTokenContract(token)
    const decimals = await contract.decimals()
    weiPerUnit = new BigNumber(10).pow(decimals)
    contractWeiPerUnit[token] = weiPerUnit
  }
  return weiPerUnit
}

export async function convertFromContractDecimals(value: BigNumber, token: CURRENCY_ENUM) {
  const weiPerUnit = await getWeiPerUnit(token)
  return value.dividedBy(weiPerUnit)
}

export async function convertToContractDecimals(value: BigNumber, token: CURRENCY_ENUM) {
  const weiPerUnit = await getWeiPerUnit(token)
  return value.times(weiPerUnit)
}

export async function getTokenContract(token: CURRENCY_ENUM) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for ${token}`)
  await waitForWeb3Sync()
  let tokenContract: any
  switch (token) {
    case CURRENCY_ENUM.GOLD:
      tokenContract = await contractKit.contracts.getGoldToken()
      break
    case CURRENCY_ENUM.DOLLAR:
      tokenContract = await contractKit.contracts.getStableToken()
      break
    default:
      throw new Error(`Could not fetch contract for unknown token ${token}`)
  }
  return tokenContract
}

interface TokenFetchFactory {
  actionName: string
  token: CURRENCY_ENUM
  actionCreator: (balance: string) => any
  tag: string
}

export function tokenFetchFactory({ actionName, token, actionCreator, tag }: TokenFetchFactory) {
  function* tokenFetch() {
    try {
      Logger.debug(tag, 'Fetching balance')
      const account = yield call(getConnectedAccount)
      const tokenContract = yield call(getTokenContract, token)
      const balanceInWei: BigNumber = yield call([tokenContract, tokenContract.balanceOf], account)
      const balance: BigNumber = yield call(convertFromContractDecimals, balanceInWei, token)
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

export async function fetchTokenBalanceInWeiWithRetry(token: CURRENCY_ENUM, account: string) {
  Logger.debug(TAG + '@fetchTokenBalanceInWeiWithRetry', 'Checking account balance', account)
  const tokenContract = await getTokenContract(token)
  // Retry needed here because it's typically the app's first tx and seems to fail on occasion
  const balanceInWei = await retryAsync(tokenContract.balanceOf, 3, [account])
  Logger.debug(TAG + '@fetchTokenBalanceInWeiWithRetry', 'Account balance', balanceInWei.toString())
  return balanceInWei
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
