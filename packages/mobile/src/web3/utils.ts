import { estimateGas as ckEstimateGas } from '@celo/contractkit/lib/utils/web3-utils'
import BigNumber from 'bignumber.js'
import { call } from 'redux-saga/effects'
import { GAS_INFLATION_FACTOR } from 'src/config'
import Logger from 'src/utils/Logger'
import { getWeb3, getWeb3Async } from 'src/web3/contracts'
import { Tx } from 'web3-core'
import { TransactionObject } from 'web3-eth'

const TAG = 'web3/utils'

// Estimate gas taking into account the configured inflation factor
export async function estimateGas(txObj: TransactionObject<any>, txParams: Tx) {
  const web3 = await getWeb3Async()
  const gasEstimator = (_tx: Tx) => txObj.estimateGas({ ..._tx })
  const getCallTx = (_tx: Tx) => {
    // @ts-ignore missing _parent property from TransactionObject type.
    return { ..._tx, data: txObj.encodeABI(), to: txObj._parent._address }
  }
  const caller = (_tx: Tx) => web3.eth.call(getCallTx(_tx))
  const gas = new BigNumber(await ckEstimateGas(txParams, gasEstimator, caller))
    .times(GAS_INFLATION_FACTOR)
    .integerValue()
  return gas
}

// Note: This returns Promise<Block>
export async function getLatestBlock() {
  Logger.debug(TAG, 'Getting latest block')
  const web3 = await getWeb3Async()
  return web3.eth.getBlock('latest')
}

export async function getLatestBlockNumber() {
  Logger.debug(TAG, 'Getting latest block number')
  const web3 = await getWeb3Async()
  return web3.eth.getBlockNumber()
}

// TODO Warning: this approach causes problems in certain cases where
// parallel txs are being sent
export function* getLatestNonce(address: string) {
  Logger.debug(TAG, 'Fetching latest nonce (incl. pending)')
  const web3 = yield call(getWeb3)
  // Note tx count is 1-indexed but nonces are 0-indexed
  const nonce = (yield call(web3.eth.getTransactionCount, address, 'pending')) - 1
  Logger.debug(TAG, `Latest nonce found: ${nonce}`)
  return nonce
}
