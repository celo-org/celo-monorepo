// Originally taken from https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

import { parseSignature } from '@celo/utils/lib/signatureUtils'
import { account as Account, bytes, hash, nat, RLP } from 'eth-lib'
import * as _ from 'underscore'
import * as helpers from 'web3-core-helpers'
import * as utils from 'web3-utils'

import Web3 from 'web3'

function isNot(value: any) {
  return _.isUndefined(value) || _.isNull(value)
}

function trimLeadingZero(hex: string) {
  while (hex && hex.startsWith('0x0')) {
    hex = '0x' + hex.slice(3)
  }
  return hex
}

function makeEven(hex: string) {
  if (hex.length % 2 === 1) {
    hex = hex.replace('0x', '0x0')
  }
  return hex
}

export const getParsedSignatureOfAddress = async (web3: Web3, address: string, signer: string) => {
  const addressHash = web3.utils.soliditySha3({ type: 'address', value: address })
  const signature = await web3.eth.sign(addressHash, signer)
  return parseSignature(addressHash, signature, signer)
}

export async function signTransaction(web3: Web3, txn: any, privateKey: string) {
  let result: any

  if (!txn) {
    throw new Error('No transaction object given!')
  }

  const signed = (tx: any) => {
    if (!tx.gas && !tx.gasLimit) {
      throw new Error('"gas" is missing')
    }

    if (tx.nonce < 0 || tx.gas < 0 || tx.gasPrice < 0 || tx.chainId < 0) {
      throw new Error('Gas, gasPrice, nonce or chainId is lower than 0')
    }

    try {
      tx = helpers.formatters.inputCallFormatter(tx)

      const transaction = tx
      transaction.to = tx.to || '0x'
      transaction.data = tx.data || '0x'
      transaction.value = tx.value || '0x'
      transaction.chainId = utils.numberToHex(tx.chainId)
      transaction.feeCurrency = tx.feeCurrency || '0x'
      transaction.gatewayFeeRecipient = tx.gatewayFeeRecipient || '0x'
      transaction.gatewayFee = tx.gatewayFee || '0x'

      const rlpEncoded = RLP.encode([
        bytes.fromNat(transaction.nonce),
        bytes.fromNat(transaction.gasPrice),
        bytes.fromNat(transaction.gas),
        transaction.feeCurrency.toLowerCase(),
        transaction.gatewayFeeRecipient.toLowerCase(),
        bytes.fromNat(transaction.gatewayFee),
        transaction.to.toLowerCase(),
        bytes.fromNat(transaction.value),
        transaction.data,
        bytes.fromNat(transaction.chainId || '0x1'),
        '0x',
        '0x',
      ])

      const messageHash = hash.keccak256(rlpEncoded)

      const signature = Account.makeSigner(nat.toNumber(transaction.chainId || '0x1') * 2 + 35)(
        hash.keccak256(rlpEncoded),
        privateKey
      )

      const rawTx = RLP.decode(rlpEncoded)
        .slice(0, 9)
        .concat(Account.decodeSignature(signature))

      rawTx[9] = makeEven(trimLeadingZero(rawTx[9]))
      rawTx[10] = makeEven(trimLeadingZero(rawTx[10]))
      rawTx[11] = makeEven(trimLeadingZero(rawTx[11]))

      const rawTransaction = RLP.encode(rawTx)

      const values = RLP.decode(rawTransaction)
      result = {
        messageHash,
        v: trimLeadingZero(values[9]),
        r: trimLeadingZero(values[10]),
        s: trimLeadingZero(values[11]),
        rawTransaction,
      }
    } catch (e) {
      throw e
    }

    return result
  }

  // Resolve immediately if nonce, chainId and price are provided
  if (txn.nonce !== undefined && txn.chainId !== undefined && txn.gasPrice !== undefined) {
    return signed(txn)
  }

  // Otherwise, get the missing info from the Ethereum Node
  const chainId = isNot(txn.chainId) ? await web3.eth.net.getId() : txn.chainId
  const gasPrice = isNot(txn.gasPrice) ? await web3.eth.getGasPrice() : txn.gasPrice
  const nonce = isNot(txn.nonce)
    ? await web3.eth.getTransactionCount(Account.fromPrivate(privateKey).address)
    : txn.nonce

  if (isNot(chainId) || isNot(gasPrice) || isNot(nonce)) {
    throw new Error(
      'One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: ' +
        JSON.stringify({ chainId, gasPrice, nonce })
    )
  }
  return signed(_.extend(txn, { chainId, gasPrice, nonce }))
}
