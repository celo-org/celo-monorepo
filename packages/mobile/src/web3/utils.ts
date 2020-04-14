import { ensureLeading0x } from '@celo/utils/src/address'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitOutsideGenerator } from 'src/web3/contracts'
import { all, call, cancelled, put, select, spawn, take, takeLatest } from 'redux-saga/effects'

const Web3 = require('web3') // Have to import this way to avoid type errors with Web3.eth, see

const TAG = 'web3/utils'

// TODO(anna) these may need to become generator

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
  return Web3.eth.accounts.privateKeyToAccount(ensureLeading0x(privateKey)).address
}
