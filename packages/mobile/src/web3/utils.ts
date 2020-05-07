import { estimateGas as ckEstimateGas } from '@celo/contractkit/lib/utils/web3-utils'
import { ensureLeading0x } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import { call } from 'redux-saga/effects'
import { GAS_INFLATION_FACTOR } from 'src/config'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitOutsideGenerator, web3ForUtils } from 'src/web3/contracts'
import { Tx } from 'web3-core'
import { TransactionObject } from 'web3-eth'

const TAG = 'web3/utils'

// Estimate gas taking into account the configured inflation factor
export async function estimateGas(txObj: TransactionObject<any>, txParams: Tx) {
  const web3 = (await getContractKitOutsideGenerator()).web3
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
  const contractKit = await getContractKitOutsideGenerator()
  return contractKit.web3.eth.getBlock('latest')
}

export function* isAccountLocked(address: string) {
  try {
    // Test account to see if it is unlocked
    const contractKit = yield call(getContractKit)
    yield call(contractKit.eth.sign, '', address)
  } catch (e) {
    return true
  }
  return false
}

export function* getLatestNonce(address: string) {
  Logger.debug(TAG, 'Fetching latest nonce (incl. pending)')
  const contractKit = yield call(getContractKit)
  // Note tx count is 1-indexed but nonces are 0-indexed
  const nonce = (yield call(contractKit.web3.eth.getTransactionCount, address, 'pending')) - 1
  Logger.debug(TAG, `Latest nonce found: ${nonce}`)
  return nonce
}

export function getAccountAddressFromPrivateKey(privateKey: string): string {
  return web3ForUtils.eth.accounts.privateKeyToAccount(ensureLeading0x(privateKey)).address
}
