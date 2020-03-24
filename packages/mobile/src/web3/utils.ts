import { ensureLeading0x } from '@celo/utils/src/address'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'

const TAG = 'web3/utils'

// Note: This returns Promise<Block>
export function getLatestBlock() {
  Logger.debug(TAG, 'Getting latest block')
  return getContractKit().web3.eth.getBlock('latest')
}

// Note: This returns Promise<Block>
export function getBlock(blockNumber: number) {
  Logger.debug(TAG, 'Getting block ' + blockNumber)
  return getContractKit().web3.eth.getBlock(blockNumber)
}

export async function isAccountLocked(address: string) {
  try {
    // Test account to see if it is unlocked
    await getContractKit().web3.eth.sign('', address)
  } catch (e) {
    return true
  }
  return false
}

export async function getLatestNonce(address: string) {
  Logger.debug(TAG, 'Fetching latest nonce (incl. pending)')
  // Note tx count is 1-indexed but nonces are 0-indexed
  const nonce = (await getContractKit().web3.eth.getTransactionCount(address, 'pending')) - 1
  Logger.debug(TAG, `Latest nonce found: ${nonce}`)
  return nonce
}

export function getAccountAddressFromPrivateKey(privateKey: string): string {
  return getContractKit().web3.eth.accounts.privateKeyToAccount(ensureLeading0x(privateKey)).address
}
