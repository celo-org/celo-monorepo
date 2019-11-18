import { account as Account, bytes as Bytes, hash as Hash, nat as Nat, RLP } from 'eth-lib'
import { extend, isNull, isUndefined } from 'lodash'
import * as util from 'util'
import * as helpers from 'web3-core-helpers'
import * as utils from 'web3-utils'
import { Logger } from './logger'
import { getAccountAddressFromPrivateKey } from './new-web3-utils'
import { CeloPartialTxParams } from './transaction-utils'

// Original code taken from
// https://github.com/ethereum/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

// Debug-mode only: Turn this on to verify that the signing key matches the sender
// before signing as well as the recovered signer matches the original signer.
const DEBUG_MODE_CHECK_SIGNER = false

function isNot(value: any) {
  return isUndefined(value) || isNull(value)
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

function ensureCorrectSigner(sender: string, privateKey: string) {
  if (DEBUG_MODE_CHECK_SIGNER) {
    Logger.debug(
      'signing-utils@ensureCorrectSigner',
      `Checking that sender (${sender}) and ${privateKey} match...`
    )
    const generatedAddress = getAccountAddressFromPrivateKey(privateKey)
    if (sender.toLowerCase() !== generatedAddress.toLowerCase()) {
      throw new Error(
        `Address from private key: ${generatedAddress}, ` + `address of sender ${sender}`
      )
    }
    Logger.debug('signing-utils@ensureCorrectSigner', 'sender and private key match')
  }
}

export async function signTransaction(txn: CeloPartialTxParams, privateKey: string) {
  ensureCorrectSigner(txn.from, privateKey)

  let result: any

  Logger.debug('SigningUtils@signTransaction', `Received ${util.inspect(txn)}`)
  if (!txn) {
    throw new Error('No transaction object given!')
  }

  const signed = (tx: any): any => {
    if (isNot(tx.gasCurrency)) {
      Logger.info(
        'SigningUtils@signTransaction',
        `Invalid transaction: Gas currency is \"${tx.gasCurrency}\"`
      )
      throw new Error(`Invalid transaction: Gas currency is \"${tx.gasCurrency}\"`)
    }
    if (isNot(tx.gasFeeRecipient)) {
      Logger.info(
        'SigningUtils@signTransaction',
        `Invalid transaction: Gas fee recipient is \"${tx.gasFeeRecipient}\"`
      )
      throw new Error(`Invalid transaction: Gas fee recipient is \"${tx.gasFeeRecipient}\"`)
    }

    if (!tx.gas && !tx.gasLimit) {
      Logger.info(
        'SigningUtils@signTransaction',
        `Invalid transaction: Gas is \"${tx.gas}\" and gas limit is \"${tx.gasLimit}\"`
      )
      throw new Error('"gas" is missing')
    }

    if (tx.nonce < 0 || tx.gas < 0 || tx.gasPrice < 0 || tx.chainId < 0) {
      Logger.info('SigningUtils@signTransaction', 'Gas, gasPrice, nonce or chainId is lower than 0')
      throw new Error('Gas, gasPrice, nonce or chainId is lower than 0')
    }

    try {
      tx = helpers.formatters.inputCallFormatter(tx)

      const transaction = tx
      transaction.to = tx.to || '0x'
      transaction.data = tx.data || '0x'
      transaction.value = tx.value || '0x'
      transaction.chainId = utils.numberToHex(tx.chainId)

      const rlpEncoded = RLP.encode([
        Bytes.fromNat(transaction.nonce),
        Bytes.fromNat(transaction.gasPrice),
        Bytes.fromNat(transaction.gas),
        transaction.gasCurrency.toLowerCase(),
        transaction.gasFeeRecipient.toLowerCase(),
        transaction.to.toLowerCase(),
        Bytes.fromNat(transaction.value),
        transaction.data,
        Bytes.fromNat(transaction.chainId || '0x1'),
        '0x',
        '0x',
      ])

      const hash = Hash.keccak256(rlpEncoded)

      const signature = Account.makeSigner(Nat.toNumber(transaction.chainId || '0x1') * 2 + 35)(
        Hash.keccak256(rlpEncoded),
        privateKey
      )

      const rawTx = RLP.decode(rlpEncoded)
        .slice(0, 8)
        .concat(Account.decodeSignature(signature))

      rawTx[8] = makeEven(trimLeadingZero(rawTx[8]))
      rawTx[9] = makeEven(trimLeadingZero(rawTx[9]))
      rawTx[10] = makeEven(trimLeadingZero(rawTx[10]))

      const rawTransaction = RLP.encode(rawTx)

      const values = RLP.decode(rawTransaction)
      result = {
        messageHash: hash,
        v: trimLeadingZero(values[8]),
        r: trimLeadingZero(values[9]),
        s: trimLeadingZero(values[10]),
        rawTransaction,
      }
    } catch (e) {
      throw e
    }

    if (DEBUG_MODE_CHECK_SIGNER) {
      Logger.debug(
        'transaction-utils@getRawTransaction@Signing',
        `Signed result of \"${util.inspect(tx)}\" is \"${util.inspect(result)}\"`
      )
      const recoveredSigner = recoverTransaction(result.rawTransaction).toLowerCase()
      if (recoveredSigner !== txn.from) {
        throw new Error(
          `transaction-utils@getRawTransaction@Signing: Signer mismatch ${recoveredSigner} != ${
            txn.from
          }, retrying...`
        )
      } else {
        Logger.debug(
          'transaction-utils@getRawTransaction@Signing',
          `Recovered signer is same as sender, code is working correctly: ${txn.from}`
        )
      }
    }

    return result
  }

  // Resolve immediately if nonce, chainId and price are provided
  if (txn.nonce !== undefined && txn.chainId !== undefined && txn.gasPrice !== undefined) {
    return signed(txn)
  }

  const chainId = txn.chainId
  const gasPrice = txn.gasPrice
  const nonce = txn.nonce

  if (isNot(chainId) || isNot(gasPrice) || isNot(nonce)) {
    throw new Error(
      'One of the values "chainId", "gasPrice", or "nonce" couldn\'t be fetched: ' +
        JSON.stringify({ chainId, gasPrice, nonce })
    )
  }
  return signed(extend(txn, { chainId, gasPrice, nonce }))
}

// Recover sender address from a raw transaction.
export function recoverTransaction(rawTx: string): string {
  const values = RLP.decode(rawTx)
  Logger.debug('signing-utils@recoverTransaction', `Values are ${values}`)
  const signature = Account.encodeSignature(values.slice(8, 11))
  const recovery = Bytes.toNumber(values[8])
  // tslint:disable-next-line:no-bitwise
  const extraData = recovery < 35 ? [] : [Bytes.fromNumber((recovery - 35) >> 1), '0x', '0x']
  const signingData = values.slice(0, 8).concat(extraData)
  const signingDataHex = RLP.encode(signingData)
  return Account.recover(Hash.keccak256(signingDataHex), signature)
}
