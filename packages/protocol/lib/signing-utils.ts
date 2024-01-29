// Originally taken from https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

import { parseSignature } from '@celo/utils/lib/signatureUtils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { LocalWallet } from '@celo/wallet-local'
import Web3 from 'web3'

function isNot(value: any) {
  return value === null || value === undefined
}

export const getParsedSignatureOfAddress = async (web3: Web3, address: string, signer: string) => {
  const addressHash = web3.utils.soliditySha3({ type: 'address', value: address })
  const signature = await web3.eth.sign(addressHash, signer)
  return parseSignature(addressHash, signature, signer)
}

export async function signTransaction(web3: Web3, txn: any, privateKey: string) {

  if (!txn) {
    throw new Error('No transaction object given!')
  }

  const signed = async (tx: any) => {
    if (!tx.gas && !tx.gasLimit) {
      throw new Error('"gas" is missing')
    }

    if (tx.nonce < 0 || tx.gas < 0 || tx.gasPrice < 0 || tx.chainId < 0) {
      throw new Error('Gas, gasPrice, nonce or chainId is lower than 0')
    }
    try {
      const wallet = new LocalWallet()

      wallet.addAccount(privateKey)

      return wallet.signTransaction(tx)

    } catch (e) {
      console.info('Error signing transaction', e)
      throw e
    }
  }

  // Resolve immediately if nonce, chainId and price are provided
  if (txn.nonce !== undefined && txn.chainId !== undefined && txn.gasPrice !== undefined) {
    return signed(txn)
  }

  // Otherwise, get the missing info from the Ethereum Node
  const chainId = isNot(txn.chainId) ? await web3.eth.getChainId() : txn.chainId
  const gasPrice = isNot(txn.gasPrice) ? await web3.eth.getGasPrice() : txn.gasPrice
  const nonce = isNot(txn.nonce)
    ? await web3.eth.getTransactionCount(privateKeyToAddress(privateKey))
    : txn.nonce

  if (isNot(chainId) || isNot(gasPrice) || isNot(nonce)) {
    throw new Error(
      'One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: ' +
        JSON.stringify({ chainId, gasPrice, nonce })
    )
  }
  return signed({...txn, chainId, gasPrice, nonce })
}
