import { ensureLeading0x } from '@celo/utils/src/address'
// TODO(anna) these may need to become generator
import BigNumber from 'bignumber.js'
import { call } from 'redux-saga/effects'
import { GAS_INFLATION_FACTOR } from 'src/config'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitOutsideGenerator } from 'src/web3/contracts'
import Web3 from 'web3'
import { Tx } from 'web3-core'
import { TransactionObject } from 'web3-eth'

const TAG = 'web3/utils'

// Estimate gas taking into account the configured inflation factor
export async function estimateGas(tx: TransactionObject<any>, txParams: Tx) {
  const gas = new BigNumber(await tx.estimateGas(txParams))
  return gas.times(GAS_INFLATION_FACTOR).integerValue()
}

// Note: This returns Promise<Block>
export async function getLatestBlock() {
  Logger.debug(TAG, 'Getting latest block')
  const contractKit = await getContractKitOutsideGenerator()
  return contractKit.web3.eth.getBlock('latest')
}

export async function isAccountLocked(address: string) {
  try {
    // Test account to see if it is unlocked
    const contractKit = await getContractKitOutsideGenerator()
    await contractKit.web3.eth.sign('', address)
  } catch (e) {
    return true
  }
  return false
}

export async function* getLatestNonce(address: string) {
  Logger.debug(TAG, 'Fetching latest nonce (incl. pending)')
  const contractKit = yield call(getContractKit)
  // Note tx count is 1-indexed but nonces are 0-indexed
  const nonce = contractKit.web3.eth.getTransactionCount(address, 'pending') - 1
  Logger.debug(TAG, `Latest nonce found: ${nonce}`)
  return nonce
}

export function getAccountAddressFromPrivateKey(privateKey: string): string {
  return new Web3().eth.accounts.privateKeyToAccount(ensureLeading0x(privateKey)).address
}
